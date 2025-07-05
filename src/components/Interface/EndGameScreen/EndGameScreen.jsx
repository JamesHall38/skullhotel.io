import { useState, useEffect, useRef } from 'react';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useDoor from '../../../hooks/useDoor';
import useMonster from '../../../hooks/useMonster';
import useLight from '../../../hooks/useLight';
import useGridStore from '../../../hooks/useGrid';
import useLocalization from '../../../hooks/useLocalization';
import SkullHotelLogo from '../Logo';
import './EndGameScreen.css';
import { regenerateData } from '../../../utils/config';
import {
	exitPointerLock,
	requestPointerLock,
	isPointerLocked,
} from '../../../utils/pointerLock';
import {
	addGuestBookEntry,
	NAME_VALIDATION_RULES,
	isValidPlayerName,
} from '../../../firebase/guestBookService';

const StaticTrianglePattern = ({ position = 'left' }) => {
	const transform = position.includes('right') ? 'scale(-1, 1)' : '';

	return (
		<svg
			className={`static-triangle-pattern ${position}`}
			style={{ transform }}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 130 320"
			preserveAspectRatio="xMidYMid meet"
			fill="none"
		>
			<path
				d="M100.941 63.601L112.126 73.558C112.814 74.17 113.902 73.682 113.902 72.761V55.436C113.902 54.847 113.424 54.37 112.835 54.37H79.949C78.9931 54.37 78.5198 55.53 79.2031 56.199L124.587 100.597C125.263 101.257 126.4 100.779 126.4 99.834V54.37"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M112.533 29.303V19.17C112.533 18.581 112.056 18.103 111.467 18.103H45.9999C45.0198 18.103 44.5585 19.314 45.2901 19.966L67.43 39.699C67.6254 39.874 67.878 39.97 68.1397 39.97H124.8C125.389 39.97 125.867 39.492 125.867 38.903V1.57C125.867 0.981 125.389 0.503 124.8 0.503H4.69294C3.74485 0.503 3.26795 1.648 3.93547 2.321L125.867 125.303"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M102.008 256.339L113.193 246.382C113.88 245.769 114.969 246.258 114.969 247.178V264.503C114.969 265.092 114.491 265.57 113.902 265.57H81.0157C80.0597 265.57 79.5864 264.409 80.2698 263.741L125.654 219.343C126.329 218.682 127.467 219.161 127.467 220.105V265.57"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M113.6 290.636V300.77C113.6 301.359 113.122 301.836 112.533 301.836H47.0666C46.0864 301.836 45.6252 300.625 46.3568 299.973L68.4967 280.24C68.692 280.066 68.9446 279.97 69.2064 279.97H125.867C126.456 279.97 126.933 280.447 126.933 281.036V318.37C126.933 318.959 126.456 319.436 125.867 319.436H5.75962C4.81153 319.436 4.33463 318.292 5.00215 317.619L126.933 194.636"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M28.659 91.006L17.4739 81.048C16.7862 80.436 15.698 80.924 15.698 81.845V99.17C15.698 99.759 16.1756 100.236 16.7647 100.236H49.6509C50.6068 100.236 51.0801 99.076 50.3968 98.407L5.01249 54.01C4.33721 53.349 3.1999 53.827 3.1999 54.772V100.236"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M28.659 232.134L17.4739 242.091C16.7862 242.704 15.698 242.215 15.698 241.295V223.97C15.698 223.381 16.1756 222.903 16.7647 222.903H49.6509C50.6068 222.903 51.0801 224.064 50.3968 224.732L5.01249 269.13C4.33721 269.79 3.1999 269.312 3.1999 268.367V222.903"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M17.0665 125.303V135.436C17.0665 136.026 17.5441 136.503 18.1332 136.503H83.6C84.5801 136.503 85.0414 135.292 84.3097 134.64L62.1699 114.907C61.9745 114.733 61.7219 114.636 61.4602 114.636H4.79988C4.21078 114.636 3.73321 115.114 3.73321 115.703V153.036C3.73321 153.626 4.21078 154.103 4.79988 154.103H124.907C125.855 154.103 126.332 152.959 125.664 152.285L3.73321 29.303"
				stroke="#EFD89B"
				strokeWidth="4"
			/>

			<path
				d="M17.0665 197.836V187.703C17.0665 187.114 17.5441 186.636 18.1332 186.636H83.6C84.5801 186.636 85.0414 187.847 84.3097 188.499L62.1699 208.233C61.9745 208.407 61.7219 208.503 61.4602 208.503H4.79988C4.21078 208.503 3.73322 208.025 3.73322 207.436V170.103C3.73322 169.514 4.21078 169.036 4.79988 169.036H124.907C125.855 169.036 126.332 170.181 125.664 170.854L3.73322 293.836"
				stroke="#EFD89B"
				strokeWidth="4"
			/>
		</svg>
	);
};

const EndGameScreen = () => {
	const [playerName, setPlayerName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [nameError, setNameError] = useState('');
	const [focusedElement, setFocusedElement] = useState(0);
	const interactiveElements = useRef([]);
	const [isRestarting, setIsRestarting] = useState(false);

	const { t } = useLocalization();
	const restart = useGame((state) => state.restart);
	const incrementRealDeaths = useGame((state) => state.incrementRealDeaths);
	const realDeaths = useGame((state) => state.realDeaths);
	const restartInterface = useInterface((state) => state.restart);
	const restartDoor = useDoor((state) => state.restart);
	const restartMonster = useMonster((state) => state.restart);
	const restartLight = useLight((state) => state.restart);
	const initializeIfNeeded = useGridStore((state) => state.initializeIfNeeded);

	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const setIsEndScreen = useGame((state) => state.setIsEndScreen);
	const setIsEndAnimationPlaying = useGame(
		(state) => state.setIsEndAnimationPlaying
	);
	const setEndAnimationPlaying = useGame(
		(state) => state.setEndAnimationPlaying
	);
	const deviceMode = useGame((state) => state.deviceMode);
	const gameStartTime = useGame((state) => state.gameStartTime);
	const gameEndTime = useGame((state) => state.gameEndTime);
	const setGameStartTime = useGame((state) => state.setGameStartTime);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const introIsPlaying = useGame((state) => state.introIsPlaying);

	const [completionTime, setCompletionTime] = useState(0);
	const lastNavigationTime = useRef(0);

	useEffect(() => {
		if (isEndScreen) {
			setSubmitted(false);
			setPlayerName('');
			setNameError('');
			setFocusedElement(0);
			setIsAnyPopupOpen(true);
			setIsGameplayActive(false);

			const timeTaken = gameEndTime
				? Math.floor((gameEndTime - gameStartTime) / 1000)
				: 0;
			setCompletionTime(timeTaken);

			setTimeout(() => {
				const canvas = document.querySelector('canvas');
				if (canvas && canvas._reactInternals) {
					const camera =
						canvas._reactInternals.fiber.reconciler.config.roots[0]
							.containerInfo._internalRoot.current.child.child.memoizedState
							.instance.state.gl.camera;
					camera.position.set(10.77, 1.5, -3);
					camera.rotation.set(0, Math.PI, 0);
					camera.updateMatrixWorld(true);
				}
			}, 200);
		} else {
			setIsAnyPopupOpen(false);
		}
	}, [
		isEndScreen,
		gameStartTime,
		gameEndTime,
		setIsAnyPopupOpen,
		setIsGameplayActive,
	]);

	useEffect(() => {
		if (isEndScreen && deviceMode === 'keyboard') {
			if (isPointerLocked()) {
				exitPointerLock();
			}
		}
	}, [isEndScreen, deviceMode]);

	useEffect(() => {
		if (!isEndScreen || deviceMode !== 'gamepad') return;

		interactiveElements.current = [];

		setTimeout(() => {
			const elements = document.querySelectorAll(
				'.end-game-screen input, .end-game-screen button'
			);
			interactiveElements.current = Array.from(elements);

			if (interactiveElements.current.length > 0) {
				setFocusedElement(0);
			}
		}, 100);

		const handleGamepadInput = () => {
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
			if (now - lastNavigationTime.current < 250) {
				return;
			}

			const dpadUp = gamepad.buttons[12]?.pressed;
			const dpadDown = gamepad.buttons[13]?.pressed;

			const leftStickY = gamepad.axes[1];

			const DEADZONE = 0.5;
			const stickUp = leftStickY < -DEADZONE;
			const stickDown = leftStickY > DEADZONE;

			const up = dpadUp || stickUp;
			const down = dpadDown || stickDown;

			const activeElement = document.activeElement;
			const isInputActive = activeElement && activeElement.tagName === 'INPUT';

			if (up && !isInputActive) {
				setFocusedElement((prev) => Math.max(0, prev - 1));
				lastNavigationTime.current = now;
			} else if (down && !isInputActive) {
				setFocusedElement((prev) =>
					Math.min(interactiveElements.current.length - 1, prev + 1)
				);
				lastNavigationTime.current = now;
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;
			if (aButtonPressed && interactiveElements.current[focusedElement]) {
				if (
					!isInputActive ||
					document.activeElement !== interactiveElements.current[focusedElement]
				) {
					interactiveElements.current[focusedElement].click();

					if (interactiveElements.current[focusedElement].tagName === 'INPUT') {
						interactiveElements.current[focusedElement].focus();
					}

					lastNavigationTime.current = now;
				}
			}

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed && isInputActive) {
				document.activeElement.blur();
				lastNavigationTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadInput, 16);
		return () => clearInterval(interval);
	}, [isEndScreen, deviceMode, focusedElement]);

	useEffect(() => {
		interactiveElements.current.forEach((el) => {
			el.classList.remove('gamepad-focus');
		});

		if (interactiveElements.current[focusedElement]) {
			interactiveElements.current[focusedElement].classList.add(
				'gamepad-focus'
			);
		}
	}, [focusedElement]);

	useEffect(() => {
		if (introIsPlaying && isRestarting) {
			setIsEndScreen(false);
			setIsRestarting(false);
		}
	}, [introIsPlaying, isRestarting, setIsEndScreen]);

	const resetGame = async () => {
		if (isRestarting) return;

		setIsRestarting(true);

		if (playerName.trim() && !nameError && !submitted && !isSubmitting) {
			try {
				await addGuestBookEntry(
					playerName.trim(),
					gameStartTime,
					gameEndTime,
					realDeaths
				);
				const isDebugMode = window.location.hash.includes('#debug');
				const storageKey = isDebugMode
					? 'skullhotel_debug_last_player_name'
					: 'skullhotel_last_player_name';
				localStorage.setItem(storageKey, playerName.trim());
			} catch (error) {
				console.error('Failed to submit score before restart:', error);
			}
		}

		setIsEndAnimationPlaying(false);
		setEndAnimationPlaying(false);
		setIsAnyPopupOpen(false);
		setIsGameplayActive(true);

		const positionCamera = () => {
			const camera =
				document.querySelector('canvas')?._reactInternals?.fiber?.reconciler
					?.config?.roots[0]?.containerInfo?._internalRoot?.current?.child
					?.child?.memoizedState?.instance?.state?.gl?.camera;

			if (camera) {
				camera.position.set(10.77, -0.2, -3);
				camera.rotation.set(0, Math.PI, 0);
				camera.updateMatrixWorld(true);
			}
		};

		positionCamera();

		incrementRealDeaths();
		restart();
		restartDoor();
		restartMonster();
		restartLight();
		regenerateData();
		initializeIfNeeded();
		restartInterface();

		positionCamera();

		setTimeout(() => {
			positionCamera();

			setPlayIntro(true);
			setGameStartTime();

			if (deviceMode === 'keyboard') {
				const canvas = document.querySelector('canvas');
				if (canvas && !isPointerLocked()) {
					requestPointerLock(canvas);
				}
			}

			setTimeout(positionCamera, 100);
		}, 100);
	};

	const validatePlayerName = (name) => {
		if (!name.trim()) {
			setNameError('');
			return;
		}

		if (!isValidPlayerName(name)) {
			if (name.trim().length < NAME_VALIDATION_RULES.minLength) {
				setNameError(
					t('ui.endGameScreen.nameValidation.tooShort', {
						min: NAME_VALIDATION_RULES.minLength,
					})
				);
			} else if (name.trim().length > NAME_VALIDATION_RULES.maxLength) {
				setNameError(
					t('ui.endGameScreen.nameValidation.tooLong', {
						max: NAME_VALIDATION_RULES.maxLength,
					})
				);
			} else {
				setNameError(t('ui.endGameScreen.nameValidation.invalidPattern'));
			}
		} else {
			setNameError('');
		}
	};

	const handleNameChange = (e) => {
		const newName = e.target.value;
		setPlayerName(newName);
		validatePlayerName(newName);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (playerName.trim() && !isSubmitting && !nameError) {
			setIsSubmitting(true);
			try {
				await addGuestBookEntry(
					playerName.trim(),
					gameStartTime,
					gameEndTime,
					realDeaths
				);
				const isDebugMode = window.location.hash.includes('#debug');
				const storageKey = isDebugMode
					? 'skullhotel_debug_last_player_name'
					: 'skullhotel_last_player_name';
				localStorage.setItem(storageKey, playerName.trim());

				if (window.steamAPI && window.steamAPI.guestbookSigned) {
					window.steamAPI.guestbookSigned();
				}

				setSubmitted(true);
			} catch (error) {
				console.error('Failed to submit score:', error);
				alert(
					`Error: ${
						error.message || t('ui.endGameScreen.nameValidation.submitError')
					}`
				);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const formatTime = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = Math.floor(seconds % 60);

		return `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	if (!isEndScreen) return null;

	return (
		<div className="end-game-screen" onClick={(e) => e.stopPropagation()}>
			<div className="triangle-patterns-container">
				<div className="column">
					<StaticTrianglePattern />
					<StaticTrianglePattern />
					<StaticTrianglePattern />
				</div>
				<div className="column">
					<StaticTrianglePattern position="right" />
					<StaticTrianglePattern position="right" />
					<StaticTrianglePattern position="right" />
				</div>
			</div>

			<SkullHotelLogo noOutline />
			<div className="column">
				<div className="end-game-message">
					{t('ui.endGameScreen.thankYouForPlaying')}
				</div>
				<div className="completion-time">
					{t('ui.endGameScreen.yourTime')} {formatTime(completionTime)}
				</div>
			</div>

			{!submitted ? (
				<form
					onSubmit={handleSubmit}
					className="name-input-container"
					onClick={(e) => e.stopPropagation()}
				>
					<input
						type="text"
						id="player-name"
						value={playerName}
						onChange={handleNameChange}
						placeholder={t('ui.endGameScreen.enterYourName')}
						disabled={isSubmitting}
						className={nameError ? 'input-error' : ''}
						onClick={(e) => e.stopPropagation()}
					/>
					<button
						type="submit"
						className="submit-button"
						disabled={!playerName.trim() || isSubmitting || nameError}
						onClick={(e) => {
							e.stopPropagation();
							handleSubmit(e);
						}}
					>
						{isSubmitting
							? t('ui.endGameScreen.saving')
							: t('ui.endGameScreen.signGuestBook')}
					</button>
				</form>
			) : (
				<div className="submission-success">
					{t('ui.endGameScreen.submissionSuccess')}
				</div>
			)}

			<button
				className="restart-button lincoln-regular"
				onClick={(e) => {
					e.stopPropagation();
					resetGame();
				}}
			>
				{isRestarting
					? t('ui.endGameScreen.restarting')
					: t('ui.endGameScreen.playAgain')}
			</button>
		</div>
	);
};

export default EndGameScreen;
