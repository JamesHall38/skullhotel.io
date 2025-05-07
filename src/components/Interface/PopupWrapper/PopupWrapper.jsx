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
import {
	isPointerLocked,
	exitPointerLock,
	requestPointerLock,
} from '../../../utils/pointerLock';
import './PopupWrapper.css';

export default function PopupWrapper({ children, cursorType }) {
	const [isVisible, setIsVisible] = useState(false);
	const [isGamepad, setIsGamepad] = useState(false);
	const contentRef = useRef(null);
	const [focusableElements, setFocusableElements] = useState([]);
	const [currentFocus, setCurrentFocus] = useState(-1);
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
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const isMobile = useGame((state) => state.isMobile);
	const prevBButtonRef = useState(false);
	const prevStickInputRef = useRef({ vertical: 0, horizontal: 0 });
	const lastNavigationTime = useRef(0);
	const loading = !useGame((state) => state.shouldRenderThreeJs);
	const justOpenedRef = useRef(false);

	const handleOpen = useCallback(() => {
		setIsVisible(true);
		setIsLocked(false);
		setIsGameplayActive(false);
		justOpenedRef.current = true;

		setTimeout(() => {
			justOpenedRef.current = false;
		}, 500);

		if (deviceMode === 'keyboard' && isPointerLocked()) {
			exitPointerLock();
		}
	}, [setIsLocked, deviceMode, setIsGameplayActive]);

	const handleClose = useCallback(() => {
		if (isMobile && justOpenedRef.current) {
			return;
		}

		setIsVisible(false);
		setIsGameplayActive(true);
		setIsAnyPopupOpen(false);

		if (
			!openDeathScreen &&
			!disableControls &&
			!isEndScreen &&
			deviceMode === 'keyboard' &&
			!loading
		) {
			setIsLocked(true);
			const canvas = document.querySelector('canvas');
			if (canvas && !isPointerLocked()) {
				requestPointerLock(canvas);
			}
		}
	}, [
		openDeathScreen,
		disableControls,
		isEndScreen,
		deviceMode,
		loading,
		setIsLocked,
		setIsAnyPopupOpen,
		setIsGameplayActive,
		isMobile,
	]);

	const handleContainerClick = useCallback(
		(e) => {
			if (isMobile && justOpenedRef.current) {
				e.stopPropagation();
				return;
			}

			if (e.target === e.currentTarget) {
				handleClose();
			}
			e.stopPropagation();
		},
		[handleClose, isMobile]
	);

	useEffect(() => {
		setIsGamepad(deviceMode === 'gamepad');
	}, [deviceMode]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (isMobile && justOpenedRef.current) {
				return;
			}

			if (e.target.classList?.contains('popup-content-container')) {
				handleClose();
				setIsAnyPopupOpen(false);
			}
		};

		window.addEventListener('mousedown', handleClickOutside);
		return () => window.removeEventListener('mousedown', handleClickOutside);
	}, [handleClose, setIsAnyPopupOpen, isMobile]);

	useEffect(() => {
		if (isVisible && contentRef.current && deviceMode === 'gamepad') {
			const elements = contentRef.current.querySelectorAll(
				'button, a, input, [role="button"], .pagination-button, .restart-button, .submit-button, .guestbook-entry'
			);

			const filteredElements = Array.from(elements).filter(
				(element) => !element.hasAttribute('data-gamepad-skip')
			);

			setFocusableElements(filteredElements);
			if (filteredElements.length > 0) {
				setCurrentFocus(0);
			}
		}
	}, [isVisible, deviceMode]);

	useEffect(() => {
		if (currentFocus >= 0 && currentFocus < focusableElements.length) {
			focusableElements[currentFocus].classList.add('gamepad-focus');
		}

		return () => {
			focusableElements.forEach((element) => {
				element.classList.remove('gamepad-focus');
			});
		};
	}, [currentFocus, focusableElements]);

	useEffect(() => {
		if (!isVisible || deviceMode !== 'gamepad') return;

		const handleGamepadNavigation = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			let gamepad = null;

			for (const gp of gamepads) {
				if (gp && gp.connected) {
					gamepad = gp;
					break;
				}
			}

			if (!gamepad) return;

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed && !prevBButtonRef[0]) {
				handleClose();
				setIsAnyPopupOpen(false);
				prevBButtonRef[0] = true;
				return;
			} else if (!bButtonPressed) {
				prevBButtonRef[0] = false;
			}

			const now = Date.now();
			if (now - lastNavigationTime.current < 200) {
				return;
			}

			const dpadUp = gamepad.buttons[12]?.pressed;
			const dpadDown = gamepad.buttons[13]?.pressed;
			const dpadLeft = gamepad.buttons[14]?.pressed;
			const dpadRight = gamepad.buttons[15]?.pressed;

			const leftStickY = gamepad.axes[1];
			const leftStickX = gamepad.axes[0];

			const DEADZONE = 0.5;
			const stickUp = leftStickY < -DEADZONE;
			const stickDown = leftStickY > DEADZONE;
			const stickLeft = leftStickX < -DEADZONE;
			const stickRight = leftStickX > DEADZONE;

			const up = dpadUp || stickUp;
			const down = dpadDown || stickDown;
			const left = dpadLeft || stickLeft;
			const right = dpadRight || stickRight;

			let shouldUpdateNavigationTime = false;

			if (
				(up || left) &&
				(!prevStickInputRef.current.up || !prevStickInputRef.current.left)
			) {
				setCurrentFocus((prev) => Math.max(0, prev - 1));
				shouldUpdateNavigationTime = true;
			} else if (
				(down || right) &&
				(!prevStickInputRef.current.down || !prevStickInputRef.current.right)
			) {
				setCurrentFocus((prev) =>
					Math.min(focusableElements.length - 1, prev + 1)
				);
				shouldUpdateNavigationTime = true;
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;
			if (
				aButtonPressed &&
				currentFocus >= 0 &&
				currentFocus < focusableElements.length
			) {
				focusableElements[currentFocus].click();
				shouldUpdateNavigationTime = true;
			}

			prevStickInputRef.current = { up, down, left, right };

			if (shouldUpdateNavigationTime) {
				lastNavigationTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadNavigation, 16); // ~60fps
		return () => clearInterval(interval);
	}, [
		isVisible,
		deviceMode,
		currentFocus,
		focusableElements,
		handleClose,
		setIsAnyPopupOpen,
		prevBButtonRef,
	]);

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
			<div className="popup-content-container" ref={contentRef}>
				{childrenWithProps}
			</div>
		</div>
	);
}
