import { useEffect } from 'react';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import useGamepadControls from '../../hooks/useGamepadControls';

export default function ListeningMode() {
	const setIsListening = useGame((state) => state.setIsListening);
	const setCursor = useInterface((state) => state.setCursor);
	const cursor = useInterface((state) => state.cursor);
	const gamepadControlsRef = useGamepadControls();
	const deviceMode = useGame((state) => state.deviceMode);
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);

	useEffect(() => {
		const handleMouseDown = (e) => {
			if (e.button === 2 && deviceMode === 'keyboard' && !isAnyPopupOpen) {
				e.stopPropagation();
				setIsListening(true);
				setCursor('listening');
			}
		};

		const handleMouseUp = (e) => {
			if (e.button === 2 && deviceMode === 'keyboard') {
				e.stopPropagation();
				setIsListening(false);
				setCursor(null);
			}
		};

		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [setIsListening, setCursor, deviceMode, isAnyPopupOpen]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (
				gamepadControls.rightClick &&
				cursor !== 'listening' &&
				!isAnyPopupOpen
			) {
				setIsListening(true);
				setCursor('listening');
			} else if (!gamepadControls.rightClick && cursor === 'listening') {
				setIsListening(false);
				setCursor(null);
			}
		};

		const interval = setInterval(checkGamepad, 16); // ~60fps

		return () => clearInterval(interval);
	}, [
		gamepadControlsRef,
		setIsListening,
		setCursor,
		deviceMode,
		cursor,
		isAnyPopupOpen,
	]);

	return null;
}
