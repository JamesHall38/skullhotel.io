import { useEffect } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';

export default function ListeningMode() {
	const setIsListening = useGame((state) => state.setIsListening);
	const setCursor = useInterface((state) => state.setCursor);

	useEffect(() => {
		const handleMouseDown = (e) => {
			if (e.button === 2) {
				e.stopPropagation();
				setIsListening(true);
				setCursor('listening');
			}
		};

		const handleMouseUp = (e) => {
			if (e.button === 2) {
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
	}, [setIsListening, setCursor]);

	return null;
}
