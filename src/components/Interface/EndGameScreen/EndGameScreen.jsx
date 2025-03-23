import { useState, useEffect } from 'react';
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
	addGuestBookEntry,
	NAME_VALIDATION_RULES,
	isValidPlayerName,
} from '../../../firebase/guestBookService';

function reset() {
	regenerateData();
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
	useLight.getState().restart();
	useGridStore.getState().isInitialized = false;
	useGridStore.getState().initializeIfNeeded();
	useGame.getState().setPlayIntro(true);
}

const EndGameScreen = () => {
	const [playerName, setPlayerName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [nameError, setNameError] = useState('');

	const isEndScreen = useGame((state) => state.isEndScreen);
	const setIsEndScreen = useGame((state) => state.setIsEndScreen);
	const setIsEndAnimationPlaying = useGame(
		(state) => state.setIsEndAnimationPlaying
	);
	const deviceMode = useGame((state) => state.deviceMode);
	const gameStartTime = useGame((state) => state.gameStartTime);

	const [completionTime, setCompletionTime] = useState(0);

	useEffect(() => {
		if (isEndScreen) {
			setSubmitted(false);
			setPlayerName('');
			setNameError('');

			const endTime = Date.now();
			const timeTaken = Math.floor((endTime - gameStartTime) / 1000);
			setCompletionTime(timeTaken);
		}
	}, [isEndScreen, gameStartTime]);

	useEffect(() => {
		if (isEndScreen && deviceMode === 'keyboard') {
			document.exitPointerLock?.();
		}
	}, [isEndScreen, deviceMode]);

	const resetGame = () => {
		reset();
		setIsEndScreen(false);
		setIsEndAnimationPlaying(false);

		setTimeout(() => {
			if (deviceMode === 'keyboard') {
				const canvas = document.querySelector('canvas');
				if (canvas) {
					canvas.requestPointerLock();
				}
			}
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
				await addGuestBookEntry(playerName.trim(), gameStartTime, Date.now());
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
						onClick={(e) => e.stopPropagation()}
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
		</div>
	);
};

export default EndGameScreen;
