import { useEffect, useRef, useState } from 'react';

import closeIcon from './close.svg';
import fullScreenIcon from './fullscreen.svg';
import gamepadA from './gamepad_a.svg';
import gamepadB from './gamepad_b.svg';
import gamepadX from './gamepad_x.svg';
import gamepadY from './gamepad_y.svg';
import gamepadStart from './gamepad_start.svg';
import keyboardA from './keyboard_a.svg';
import keyboardCtrl from './keyboard_ctrl.svg';
import keyboardD from './keyboard_d.svg';
import keyboardS from './keyboard_s.svg';
import keyboardSpace from './keyboard_space.svg';
import keyboardTab from './keyboard_tab.svg';
import keyboardW from './keyboard_w.svg';
import leftJoystickHorizontal from './l_horizontal.svg';
import leftJoystickVertical from './l_vertical.svg';
import mouseRight from './mouse_right.svg';
import mouseLeft from './mouse_left.svg';

import useSettings from '../../../hooks/useSettings';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useLocalization, { languages } from '../../../hooks/useLocalization';
import {
	isPointerLocked,
	exitPointerLock,
	requestPointerLock,
} from '../../../utils/pointerLock';
import { getAudioInstance } from '../../../utils/audio';
import BugReport from '../BugReport/BugReport';
import './Settings.css';

export default function Settings({ loading }) {
	const popupRef = useRef(null);
	const isSettingsOpen = useInterface((state) => state.isSettingsOpen);
	const setIsSettingsOpen = useInterface((state) => state.setIsSettingsOpen);
	const horizontalSensitivity = useSettings(
		(state) => state.horizontalSensitivity
	);
	const setHorizontalSensitivity = useSettings(
		(state) => state.setHorizontalSensitivity
	);
	const verticalSensitivity = useSettings((state) => state.verticalSensitivity);
	const setVerticalSensitivity = useSettings(
		(state) => state.setVerticalSensitivity
	);
	const shadows = useSettings((state) => state.shadows);
	const setShadows = useSettings((state) => state.setShadows);
	const deviceMode = useGame((state) => state.deviceMode);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const end = useGame((state) => state.end);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const seenLevels = useGame((state) => state.seenLevels);
	const totalLevelTypes = useGame((state) => state.totalLevelTypes);
	const resetSeenLevels = useGame((state) => state.resetSeenLevels);

	const { t, currentLanguage, setLanguage } = useLocalization();

	const [focusedElement, setFocusedElement] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(
		!!document.fullscreenElement
	);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [dropdownSelectedIndex, setDropdownSelectedIndex] = useState(0);
	const [showBugReport, setShowBugReport] = useState(false);
	const interactiveElements = useRef([]);
	const lastInputTime = useRef(Date.now());
	const horizontalSensitivitySliderRef = useRef(null);
	const verticalSensitivitySliderRef = useRef(null);
	const sensitivityStep = 0.05;
	const lastStartButtonState = useRef(false);
	const lastFocusedElement = useRef(0);
	const lastMenuSoundTime = useRef(0);
	const prevIsSettingsOpen = useRef(isSettingsOpen);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'Escape' && isSettingsOpen) {
				setIsSettingsOpen(false);
				setIsAnyPopupOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isSettingsOpen, setIsSettingsOpen, setIsAnyPopupOpen]);

	useEffect(() => {
		if (!prevIsSettingsOpen.current && isSettingsOpen) {
			playMenuSound();
		}
		prevIsSettingsOpen.current = isSettingsOpen;
	}, [isSettingsOpen]);

	useEffect(() => {
		if (isSettingsOpen && deviceMode === 'keyboard') {
			if (isPointerLocked()) {
				exitPointerLock();
			}
		}
	}, [isSettingsOpen, deviceMode]);

	useEffect(() => {
		if (!isSettingsOpen && deviceMode === 'keyboard' && !loading) {
			if (!isAnyPopupOpen && !openDeathScreen && !isEndScreen && !end) {
				const canvas = document.querySelector('canvas');
				if (canvas && !isPointerLocked()) {
					requestPointerLock(canvas);
				}
			}
		}
	}, [
		isSettingsOpen,
		deviceMode,
		isAnyPopupOpen,
		openDeathScreen,
		isEndScreen,
		end,
		loading,
	]);

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
						!isSettingsOpen &&
						!isAnyPopupOpen
					) {
						setIsSettingsOpen(true);
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
	}, [deviceMode, isSettingsOpen, setIsSettingsOpen, isAnyPopupOpen]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target) &&
				isSettingsOpen
			) {
				setIsSettingsOpen(false);
				setIsAnyPopupOpen(false);
			}

			if (
				isDropdownOpen &&
				!event.target.closest('.language-selector') &&
				!event.target.closest('.dropdown-options')
			) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isSettingsOpen, setIsSettingsOpen, setIsAnyPopupOpen, isDropdownOpen]);

	useEffect(() => {
		setIsAnyPopupOpen(isSettingsOpen);
		if (isSettingsOpen) {
			setIsGameplayActive(false);
		} else if (!openDeathScreen && !isEndScreen && !end && !loading) {
			setIsGameplayActive(true);
		}
	}, [
		isSettingsOpen,
		setIsAnyPopupOpen,
		setIsGameplayActive,
		openDeathScreen,
		isEndScreen,
		end,
		loading,
	]);

	useEffect(() => {
		if (!isSettingsOpen || deviceMode !== 'gamepad') return;

		setTimeout(() => {
			const elements = document.querySelectorAll(
				'.settings-content input, .settings-content button, .settings-content .language-selector'
			);
			interactiveElements.current = Array.from(elements);

			if (interactiveElements.current.length > 0) {
				setFocusedElement(0);
				interactiveElements.current.forEach((el, index) => {
					if (index === 0) {
						el.classList.add('gamepad-focus');
					} else {
						el.classList.remove('gamepad-focus');
					}
				});
			}
		}, 100);
	}, [isSettingsOpen, deviceMode]);

	useEffect(() => {
		if (!isSettingsOpen) return;

		if (lastFocusedElement.current !== focusedElement) {
			playMenuSound();
			lastFocusedElement.current = focusedElement;
			if (isDropdownOpen) {
				setIsDropdownOpen(false);
			}
		}

		interactiveElements.current.forEach((el) => {
			el.classList.remove('gamepad-focus');
		});

		if (interactiveElements.current[focusedElement]) {
			interactiveElements.current[focusedElement].classList.add(
				'gamepad-focus'
			);
		}
	}, [focusedElement, isSettingsOpen, isDropdownOpen]);

	useEffect(() => {
		if (isDropdownOpen) {
			const dropdownOptions = document.querySelector('.dropdown-options');
			const selectedOption = document.querySelector(
				'.dropdown-option.selected'
			);

			if (dropdownOptions && selectedOption) {
				selectedOption.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
				});
			}
		}
	}, [dropdownSelectedIndex, isDropdownOpen]);

	useEffect(() => {
		if (!isSettingsOpen || deviceMode !== 'gamepad') return;

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

			const focusedEl = interactiveElements.current[focusedElement];
			if (
				focusedEl &&
				focusedEl.classList.contains('language-selector') &&
				isDropdownOpen
			) {
				if (up) {
					setDropdownSelectedIndex((prev) => Math.max(0, prev - 1));
					playMenuSound();
					lastInputTime.current = now;
					return;
				} else if (down) {
					setDropdownSelectedIndex((prev) =>
						Math.min(languages.length - 1, prev + 1)
					);
					playMenuSound();
					lastInputTime.current = now;
					return;
				}
			}

			if (up) {
				setFocusedElement((prev) => Math.max(0, prev - 1));
				playMenuSound();
				lastInputTime.current = now;
			} else if (down) {
				setFocusedElement((prev) =>
					Math.min(interactiveElements.current.length - 1, prev + 1)
				);
				playMenuSound();
				lastInputTime.current = now;
			}

			if (focusedEl && focusedEl.id === 'horizontalSensitivity') {
				if (left) {
					const newValue = Math.max(
						0.001,
						horizontalSensitivity - sensitivityStep
					);
					setHorizontalSensitivity(newValue);
					playMenuSound();
					lastInputTime.current = now;
				} else if (right) {
					const newValue = Math.min(1, horizontalSensitivity + sensitivityStep);
					setHorizontalSensitivity(newValue);
					playMenuSound();
					lastInputTime.current = now;
				}
			} else if (focusedEl && focusedEl.id === 'verticalSensitivity') {
				if (left) {
					const newValue = Math.max(
						0.001,
						verticalSensitivity - sensitivityStep
					);
					setVerticalSensitivity(newValue);
					playMenuSound();
					lastInputTime.current = now;
				} else if (right) {
					const newValue = Math.min(1, verticalSensitivity + sensitivityStep);
					setVerticalSensitivity(newValue);
					playMenuSound();
					lastInputTime.current = now;
				}
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;
			const xButtonPressed = gamepad.buttons[2]?.pressed;
			const actionPressed = aButtonPressed || xButtonPressed;

			if (actionPressed && focusedEl) {
				if (focusedEl.type === 'checkbox') {
					focusedEl.checked = !focusedEl.checked;
					setShadows(focusedEl.checked);
					playMenuSound();
				} else if (focusedEl.tagName === 'BUTTON') {
					focusedEl.click();
					playMenuSound();
				} else if (focusedEl.classList.contains('language-selector')) {
					if (isDropdownOpen) {
						const selectedLang = languages[dropdownSelectedIndex];
						if (selectedLang) {
							setLanguage(selectedLang.code);
						}
						setIsDropdownOpen(false);
						playMenuSound();
					} else {
						setIsDropdownOpen(true);
						const currentIndex = languages.findIndex(
							(lang) => lang.code === currentLanguage
						);
						setDropdownSelectedIndex(currentIndex >= 0 ? currentIndex : 0);
						playMenuSound();
					}
				}
				lastInputTime.current = now;
			}

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed) {
				if (isDropdownOpen) {
					setIsDropdownOpen(false);
					playMenuSound();
				} else {
					setIsSettingsOpen(false);
					setIsAnyPopupOpen(false);
					if (!openDeathScreen && !isEndScreen && !end) {
						setIsGameplayActive(true);
					}
					playMenuSound();
				}
				lastInputTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadNavigation, 16);
		return () => clearInterval(interval);
	}, [
		isSettingsOpen,
		deviceMode,
		focusedElement,
		horizontalSensitivity,
		verticalSensitivity,
		setHorizontalSensitivity,
		setVerticalSensitivity,
		setShadows,
		setIsSettingsOpen,
		setIsAnyPopupOpen,
		setIsGameplayActive,
		openDeathScreen,
		isEndScreen,
		end,
		isDropdownOpen,
		dropdownSelectedIndex,
	]);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () =>
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

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

	const playMenuSound = () => {
		const now = Date.now();
		if (now - lastMenuSoundTime.current < 150) {
			return;
		}

		const menuSound = getAudioInstance('menu');
		if (menuSound) {
			menuSound.play().catch(() => {});
			lastMenuSoundTime.current = now;
		}
	};

	const handleMouseEnter = (e) => {
		const isInteractive =
			e.target.tagName === 'BUTTON' ||
			e.target.tagName === 'INPUT' ||
			e.target.tagName === 'SELECT' ||
			e.target.closest('button') ||
			e.target.closest('input') ||
			e.target.closest('select');

		if (deviceMode === 'keyboard' && isInteractive) {
			playMenuSound();
		}
	};

	const handleLanguageChange = (e) => {
		const newLanguage = e.target.value;
		setLanguage(newLanguage);
		playMenuSound();
	};

	const handleDropdownOptionClick = (langCode, index) => {
		setLanguage(langCode);
		setDropdownSelectedIndex(index);
		setIsDropdownOpen(false);
		playMenuSound();
	};

	const handleSelectClick = (e) => {
		e.preventDefault();
		if (isDropdownOpen) {
			setIsDropdownOpen(false);
		} else {
			setIsDropdownOpen(true);
			const currentIndex = languages.findIndex(
				(lang) => lang.code === currentLanguage
			);
			setDropdownSelectedIndex(currentIndex >= 0 ? currentIndex : 0);
		}
		playMenuSound();
	};

	const handleSettingsClose = () => {
		setIsSettingsOpen(false);
		if (!openDeathScreen && !isEndScreen && !end && !loading) {
			setIsGameplayActive(true);
			if (deviceMode === 'keyboard') {
				const canvas = document.querySelector('canvas');
				if (canvas && !isPointerLocked()) {
					requestPointerLock(canvas);
				}
			}
		}
		playMenuSound();
	};

	if (!isSettingsOpen) {
		if (loading || openDeathScreen || isEndScreen || end) {
			return null;
		}
		return (
			<button
				className="settings-toggle-button"
				onClick={(e) => {
					e.stopPropagation();
					setIsSettingsOpen(true);
					setIsGameplayActive(false);
					playMenuSound();
				}}
			>
				<div className="control-keys">
					<img src={keyboardTab} alt="Settings" />
					/
					<img src={gamepadStart} alt="Settings" />
				</div>
			</button>
		);
	}

	if (showBugReport) {
		return (
			<div className="settings-overlay">
				<BugReport onClose={() => setShowBugReport(false)} />
			</div>
		);
	}

	return (
		<div
			className="settings-overlay"
			ref={popupRef}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="settings-layout">
				<button
					className="settings-close"
					onClick={handleSettingsClose}
					onMouseEnter={handleMouseEnter}
				>
					{t('ui.settings.title')}
					<img src={closeIcon} alt="Close" />
				</button>

				<section className="settings-content">
					<h2 className="settings-title">{t('ui.settings.visuals')}</h2>
					<div className="settings-item">
						<div className="setting-label">{t('ui.settings.language')}</div>
						<div
							onClick={handleSelectClick}
							onMouseEnter={handleMouseEnter}
							className={`language-selector ${
								isDropdownOpen ? 'dropdown-open' : ''
							}`}
						>
							{languages.find((lang) => lang.code === currentLanguage)
								?.nativeName || currentLanguage}
						</div>
						{isDropdownOpen && (
							<div className="dropdown-options">
								{languages.map((lang, index) => (
									<div
										key={lang.code}
										className={`dropdown-option ${
											index === dropdownSelectedIndex ? 'selected' : ''
										}`}
										onClick={(e) => handleDropdownOptionClick(lang.code, index)}
									>
										{lang.nativeName}
									</div>
								))}
							</div>
						)}
					</div>
					<button
						className="settings-item settings-hover-effect"
						onClick={(e) => {
							fullScreenHandler(e);
							playMenuSound();
						}}
						onMouseEnter={handleMouseEnter}
					>
						<div className="setting-label">
							<img src={fullScreenIcon} alt="Fullscreen" />
							{t('ui.settings.fullscreen')}
						</div>
						<div className="toggle-switch-container">
							<span className="toggle-label">
								{isFullscreen ? 'ON' : 'OFF'}
							</span>
							<div className="toggle-switch">
								<div
									className={`toggle-slider ${isFullscreen ? 'active' : ''}`}
								/>
							</div>
						</div>
					</button>

					<button
						className="settings-item settings-hover-effect"
						onClick={() => {
							setShadows(!shadows);
							playMenuSound();
						}}
						onMouseEnter={handleMouseEnter}
					>
						<div className="setting-label">{t('ui.settings.shadows')}</div>
						<div className="toggle-switch-container">
							<span className="toggle-label">{shadows ? 'ON' : 'OFF'}</span>
							<div className="toggle-switch">
								<div className={`toggle-slider ${shadows ? 'active' : ''}`} />
							</div>
						</div>
					</button>

					<h2 className="settings-title">{t('ui.settings.sensitivity')}</h2>
					<div className="settings-item">
						<div className="setting-label">
							{t('ui.settings.verticalSensitivity')}
						</div>
						<div className="slider-container">
							<input
								type="range"
								id="verticalSensitivity"
								min="0.001"
								max="1"
								step="0.001"
								value={verticalSensitivity}
								ref={verticalSensitivitySliderRef}
								onChange={(e) => {
									setVerticalSensitivity(parseFloat(e.target.value));
									playMenuSound();
								}}
								onMouseEnter={handleMouseEnter}
							/>
							<span className="sensitivity-value">
								{Math.round(
									((verticalSensitivity - 0.001) / (1 - 0.001)) * 100
								)}
							</span>
						</div>
					</div>

					<div className="settings-item">
						<div className="setting-label">
							{t('ui.settings.horizontalSensitivity')}
						</div>
						<div className="slider-container">
							<input
								type="range"
								id="horizontalSensitivity"
								min="0.001"
								max="1"
								step="0.001"
								value={horizontalSensitivity}
								ref={horizontalSensitivitySliderRef}
								onChange={(e) => {
									setHorizontalSensitivity(parseFloat(e.target.value));
									playMenuSound();
								}}
								onMouseEnter={handleMouseEnter}
							/>
							<span className="sensitivity-value">
								{Math.round(
									((horizontalSensitivity - 0.001) / (1 - 0.001)) * 100
								)}
							</span>
						</div>
					</div>

					<h2 className="settings-title">{t('ui.settings.controls')}</h2>
					<div className="settings-item">
						<span className="setting-label">{t('ui.settings.move')}</span>
						<div className="control-keys">
							<div className="control-flex">
								<img src={keyboardW} alt="Keyboard W" />
								<img src={keyboardA} alt="Keyboard A" />
								<img src={keyboardS} alt="Keyboard S" />
								<img src={keyboardD} alt="Keyboard D" />
							</div>
							/
							<div className="control-flex">
								<img
									src={leftJoystickHorizontal}
									alt="Left Joystick Horizontal"
								/>
								<img src={leftJoystickVertical} alt="Left Joystick Vertical" />
							</div>
						</div>
					</div>
					<div className="settings-item">
						<span className="setting-label">{t('ui.settings.interact')}</span>
						<div className="control-keys">
							<img src={mouseLeft} alt="Mouse Left" />
							/
							<img src={gamepadX} alt="Gamepad X" />
						</div>
					</div>
					<div className="settings-item">
						<span className="setting-label">
							{t('ui.settings.listenCarefully')}
						</span>
						<div className="control-keys">
							<img src={mouseRight} alt="Mouse Right" />
							/
							<img src={gamepadY} alt="Gamepad Y" />
						</div>
					</div>
					<div className="settings-item">
						<span className="setting-label">{t('ui.settings.crouch')}</span>
						<div className="control-keys">
							<img src={keyboardCtrl} alt="Keyboard Ctrl" />
							/
							<img src={gamepadB} alt="Gamepad B" />
						</div>
					</div>
					<div className="settings-item">
						<span className="setting-label">{t('ui.settings.jump')}</span>
						<div className="control-keys">
							<img src={keyboardSpace} alt="Keyboard Space" />
							/
							<img src={gamepadA} alt="Gamepad A" />
						</div>
					</div>

					<div>
						{seenLevels.size === totalLevelTypes && (
							<button
								className="settings-reset-button settings-hover-effect"
								onClick={() => {
									resetSeenLevels();
									playMenuSound();
								}}
								onMouseEnter={handleMouseEnter}
							>
								{t('ui.settings.resetProgress')}
							</button>
						)}

						<button
							className="settings-bug-report-button settings-hover-effect"
							onClick={() => {
								setShowBugReport(true);
								playMenuSound();
							}}
							onMouseEnter={handleMouseEnter}
						>
							{t('ui.settings.reportBug')}
						</button>
					</div>
				</section>
			</div>
		</div>
	);
}
