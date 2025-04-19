import { useState, useEffect, useRef } from 'react';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useDoor from '../../../hooks/useDoor';
import useMonster from '../../../hooks/useMonster';
import useLight from '../../../hooks/useLight';
import useGridStore from '../../../hooks/useGrid';
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

const EndGameScreen = () => {
	const [playerName, setPlayerName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [nameError, setNameError] = useState('');
	const [focusedElement, setFocusedElement] = useState(0);
	const interactiveElements = useRef([]);

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

	const [completionTime, setCompletionTime] = useState(0);
	const lastNavigationTime = useRef(0);

	useEffect(() => {
		if (isEndScreen) {
			setSubmitted(false);
			setPlayerName('');
			setNameError('');
			setFocusedElement(0);
			setIsAnyPopupOpen(true);

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
	}, [isEndScreen, gameStartTime, gameEndTime, setIsAnyPopupOpen]);

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

	const resetGame = () => {
		setIsEndScreen(false);
		setIsEndAnimationPlaying(false);
		setEndAnimationPlaying(false);
		setIsAnyPopupOpen(false);

		incrementRealDeaths();
		restart();
		restartDoor();
		restartMonster();
		restartLight();
		regenerateData();
		initializeIfNeeded();
		restartInterface();
		setPlayIntro(true);

		setGameStartTime();

		if (deviceMode === 'keyboard') {
			setTimeout(() => {
				const canvas = document.querySelector('canvas');
				if (canvas && !isPointerLocked()) {
					requestPointerLock(canvas);
				}
			}, 100);
		}
	};

	const validatePlayerName = (name) => {
		if (!name.trim()) {
			setNameError('');
			return;
		}

		if (!isValidPlayerName(name)) {
			if (name.trim().length < NAME_VALIDATION_RULES.minLength) {
				setNameError(
					`Name must be at least ${NAME_VALIDATION_RULES.minLength} characters`
				);
			} else if (name.trim().length > NAME_VALIDATION_RULES.maxLength) {
				setNameError(
					`Name must be at most ${NAME_VALIDATION_RULES.maxLength} characters`
				);
			} else {
				setNameError(NAME_VALIDATION_RULES.patternMessage);
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
				setSubmitted(true);
			} catch (error) {
				console.error('Failed to submit score:', error);
				alert(
					`Error: ${
						error.message || 'Failed to submit your entry. Please try again.'
					}`
				);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
	};

	if (!isEndScreen) return null;

	return (
		<div className="end-game-screen" onClick={(e) => e.stopPropagation()}>
			<SkullHotelLogo />
			<div className="end-game-message">Thank you for playing</div>

			<div className="completion-time">
				Your time: {formatTime(completionTime)}
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
						placeholder="Your name"
						autoFocus
						disabled={isSubmitting}
						className={nameError ? 'input-error' : ''}
						onClick={(e) => e.stopPropagation()}
					/>
					{nameError && <div className="name-error">{nameError}</div>}
					<button
						type="submit"
						className="submit-button"
						disabled={!playerName.trim() || isSubmitting || nameError}
						onClick={(e) => {
							e.stopPropagation();
							handleSubmit(e);
						}}
					>
						{isSubmitting ? 'Saving...' : 'Sign Guest Book'}
					</button>
				</form>
			) : (
				<div className="submission-success">
					Thanks for signing our guest book!
				</div>
			)}

			<button
				className="restart-button"
				onClick={(e) => {
					e.stopPropagation();
					resetGame();
				}}
			>
				Play again
			</button>

			{deviceMode === 'gamepad' && (
				<div className="gamepad-controls-hint">
					<div className="gamepad-control">
						<div className="gamepad-button dpad">↑↓</div>
						<span>Navigate</span>
					</div>
					<div className="gamepad-control">
						<div className="gamepad-button a">A</div>
						<span>Select</span>
					</div>
					{!submitted && (
						<div className="gamepad-control">
							<div className="gamepad-button b">B</div>
							<span>Exit input</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default EndGameScreen;
