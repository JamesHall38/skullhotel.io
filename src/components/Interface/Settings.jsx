import { useEffect, useRef, useState } from 'react';
import { a, useSpring, config } from '@react-spring/web';
import { RxHamburgerMenu } from 'react-icons/rx';
import { RiFullscreenFill } from 'react-icons/ri';
import { IoClose } from 'react-icons/io5';
import useSettings from '../../hooks/useSettings';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import './Settings.css';

export default function Settings() {
	const popupRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [currentWidth, setCurrentWidth] = useState(25 * getRemValue());
	const rotationSensitivity = useSettings((state) => state.rotationSensitivity);
	const setRotationSensitivity = useSettings(
		(state) => state.setRotationSensitivity
	);
	const shadows = useSettings((state) => state.shadows);
	const setShadows = useSettings((state) => state.setShadows);
	const deviceMode = useGame((state) => state.deviceMode);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);

	const [focusedElement, setFocusedElement] = useState(0);
	const interactiveElements = useRef([]);
	const lastInputTime = useRef(Date.now());
	const sensitivitySliderRef = useRef(null);
	const sensitivityStep = 0.05;
	const lastStartButtonState = useRef(false);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkStartButton = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

			for (const gamepad of gamepads) {
				if (gamepad && gamepad.connected) {
					const startButtonPressed = gamepad.buttons[9]?.pressed;

					if (
						startButtonPressed &&
						!lastStartButtonState.current &&
						!isOpen &&
						!isAnyPopupOpen
					) {
						setIsOpen(true);
						lastStartButtonState.current = true;
					} else if (!startButtonPressed && lastStartButtonState.current) {
						lastStartButtonState.current = false;
					}

					break;
				}
			}
		};

		const interval = setInterval(checkStartButton, 100);
		return () => clearInterval(interval);
	}, [deviceMode, isOpen, setIsOpen, isAnyPopupOpen]);

	function getRemValue() {
		const width = window.innerWidth;
		if (width >= 1200) return 18;
		if (width >= 992) return 16;
		if (width >= 768) return 15;
		if (width >= 576) return 14;
		return 12;
	}

	const [{ x }, api] = useSpring(() => ({ x: -currentWidth }));

	useEffect(() => {
		const handleResize = () => {
			const newWidth = 25 * getRemValue();
			setCurrentWidth(newWidth);
			api.start({ x: isOpen ? 0 : -newWidth });
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [isOpen, currentWidth, api]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target) &&
				isOpen
			) {
				setIsOpen(false);
				setIsAnyPopupOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, setIsAnyPopupOpen]);

	useEffect(() => {
		api.start({
			x: isOpen ? 0 : -currentWidth,
			immediate: false,
			config: config.stiff,
		});

		setIsAnyPopupOpen(isOpen);
	}, [isOpen, currentWidth, api, setIsAnyPopupOpen]);

	useEffect(() => {
		if (!isOpen || deviceMode !== 'gamepad') return;

		setTimeout(() => {
			const elements = document.querySelectorAll(
				'.menu-content input, .menu-content button'
			);
			interactiveElements.current = Array.from(elements);

			if (interactiveElements.current.length > 0) {
				setFocusedElement(0);
			}
		}, 100);
	}, [isOpen, deviceMode]);

	useEffect(() => {
		if (!isOpen) return;

		interactiveElements.current.forEach((el) => {
			el.classList.remove('gamepad-focus');
		});

		if (interactiveElements.current[focusedElement]) {
			interactiveElements.current[focusedElement].classList.add(
				'gamepad-focus'
			);
		}
	}, [focusedElement, isOpen]);

	useEffect(() => {
		if (!isOpen || deviceMode !== 'gamepad') return;

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

			const now = Date.now();
			if (now - lastInputTime.current < 200) {
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

			if (up) {
				setFocusedElement((prev) => Math.max(0, prev - 1));
				lastInputTime.current = now;
			} else if (down) {
				setFocusedElement((prev) =>
					Math.min(interactiveElements.current.length - 1, prev + 1)
				);
				lastInputTime.current = now;
			}

			const focusedEl = interactiveElements.current[focusedElement];
			if (focusedEl && focusedEl.id === 'sensitivity') {
				if (left) {
					const newValue = Math.max(
						0.001,
						rotationSensitivity - sensitivityStep
					);
					setRotationSensitivity(newValue);
					lastInputTime.current = now;
				} else if (right) {
					const newValue = Math.min(1, rotationSensitivity + sensitivityStep);
					setRotationSensitivity(newValue);
					lastInputTime.current = now;
				}
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;
			if (aButtonPressed && focusedEl) {
				if (focusedEl.type === 'checkbox') {
					focusedEl.checked = !focusedEl.checked;
					setShadows(focusedEl.checked);
				} else if (focusedEl.tagName === 'BUTTON') {
					focusedEl.click();
				}
				lastInputTime.current = now;
			}

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed) {
				setIsOpen(false);
				setIsAnyPopupOpen(false);
				lastInputTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadNavigation, 16);
		return () => clearInterval(interval);
	}, [
		isOpen,
		deviceMode,
		focusedElement,
		rotationSensitivity,
		setRotationSensitivity,
		setShadows,
		setIsAnyPopupOpen,
	]);

	const fullScreenHandler = (e) => {
		e.stopPropagation();
		if (!document.fullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				// Firefox
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				// Chrome, Safari and Opera
				document.documentElement.webkitRequestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				// IE/Edge
				document.documentElement.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				// Firefox
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				// Chrome, Safari and Opera
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				// IE/Edge
				document.msExitFullscreen();
			}
		}
	};

	return (
		<div ref={popupRef} onClick={(e) => e.stopPropagation()}>
			<a.div className="sheet" style={{ x }}>
				<div className="menu-content">
					<h1>Settings</h1>
					<div className="settings-group">
						<label htmlFor="sensitivity">Rotation Sensitivity</label>
						<input
							type="range"
							id="sensitivity"
							min="0.001"
							max="1"
							step="0.001"
							value={rotationSensitivity}
							ref={sensitivitySliderRef}
							onChange={(e) =>
								setRotationSensitivity(parseFloat(e.target.value))
							}
						/>
						<span className="sensitivity-value">
							{Math.round(((rotationSensitivity - 0.001) / (1 - 0.001)) * 100)}
						</span>
					</div>
					<div className="settings-group">
						<label htmlFor="shadows">Shadows</label>
						<input
							type="checkbox"
							id="shadows"
							checked={shadows}
							onChange={(e) => setShadows(e.target.checked)}
						/>
					</div>
					<button className="settings-button" onClick={fullScreenHandler}>
						full screen
						<RiFullscreenFill />
					</button>
				</div>
				<button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? (
						<IoClose className="menu-icon" />
					) : (
						<RxHamburgerMenu className="menu-icon" />
					)}
				</button>
			</a.div>
		</div>
	);
}
