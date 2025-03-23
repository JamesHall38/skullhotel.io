import {
	useEffect,
	useState,
	useCallback,
	Children,
	cloneElement,
	useRef,
} from 'react';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import './PopupWrapper.css';

export default function PopupWrapper({ children, cursorType }) {
	const [isVisible, setIsVisible] = useState(false);
	const [isGamepad, setIsGamepad] = useState(false);
	const contentRef = useRef(null);
	const cursor = useInterface((state) => state.cursor);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const gamepadControls = useGame((state) => state.gamepadControls);
	const deviceMode = useGame((state) => state.deviceMode);
	const mobileClick = useGame((state) => state.mobileClick);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const setIsLocked = useGame((state) => state.setIsLocked);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const disableControls = useGame((state) => state.disableControls);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const prevBButtonRef = useState(false);

	const handleOpen = useCallback(() => {
		setIsVisible(true);
		setIsLocked(false);
		if (document.pointerLockElement) {
			document.exitPointerLock();
		}
	}, [setIsLocked]);

	const handleClose = useCallback(() => {
		setIsVisible(false);
		setIsAnyPopupOpen(false);
		if (
			!openDeathScreen &&
			!disableControls &&
			!isEndScreen &&
			deviceMode === 'keyboard'
		) {
			setIsLocked(true);
			const canvas = document.querySelector('canvas');
			if (canvas && !document.pointerLockElement) {
				canvas.requestPointerLock();
			}
		}
	}, [
		openDeathScreen,
		disableControls,
		isEndScreen,
		deviceMode,
		setIsLocked,
		setIsAnyPopupOpen,
	]);

	const handleContainerClick = useCallback(
		(e) => {
			if (e.target === e.currentTarget) {
				handleClose();
			}
			e.stopPropagation();
		},
		[handleClose]
	);

	useEffect(() => {
		setIsGamepad(deviceMode === 'gamepad');
	}, [deviceMode]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'Escape' && isVisible) {
				handleClose();
				setIsAnyPopupOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isVisible, handleClose, setIsAnyPopupOpen]);

	useEffect(() => {
		const handleGamepadInteraction = () => {
			const xButtonPressed = gamepadControls?.action; // X/A button for opening
			const bButtonPressed = gamepadControls?.rightClick; // B button for closing
			if (cursor === cursorType && xButtonPressed && !prevBButtonRef[0]) {
				handleOpen();
				setIsAnyPopupOpen(true);
			} else if (isVisible && bButtonPressed && !prevBButtonRef[0]) {
				handleClose();
				setIsAnyPopupOpen(false);
			}
			prevBButtonRef[0] = bButtonPressed || xButtonPressed;
		};

		const intervalId = setInterval(handleGamepadInteraction, 100);
		return () => clearInterval(intervalId);
	}, [
		cursor,
		gamepadControls,
		isVisible,
		prevBButtonRef,
		cursorType,
		handleOpen,
		handleClose,
		setIsAnyPopupOpen,
	]);

	useEffect(() => {
		if (cursor === cursorType && mobileClick) {
			handleOpen();
			setIsAnyPopupOpen(true);
			setMobileClick(false);
		} else if (isVisible && mobileClick) {
			setMobileClick(false);
			setIsAnyPopupOpen(false);
		}
	}, [
		cursor,
		mobileClick,
		isVisible,
		setMobileClick,
		cursorType,
		handleOpen,
		setIsAnyPopupOpen,
	]);

	useEffect(() => {
		const handleMouseDown = (e) => {
			if (e.button === 0) {
				if (cursor === cursorType && !isVisible) {
					handleOpen();
					setIsAnyPopupOpen(true);
				}
			}
		};

		window.addEventListener('click', handleMouseDown);
		return () => window.removeEventListener('click', handleMouseDown);
	}, [cursor, isVisible, cursorType, handleOpen, setIsAnyPopupOpen]);

	if (!isVisible) return null;

	const childrenWithProps = Children.map(children, (child) => {
		if (child) {
			return cloneElement(child, { onClose: handleClose });
		}
		return child;
	});

	return (
		<div
			className={`popup-container`}
			onClick={handleContainerClick}
			data-gamepad={isGamepad}
		>
			<div ref={contentRef}>{childrenWithProps}</div>
		</div>
	);
}
