import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { ReactComponent as SkullHotelLogo } from './logo.svg';
import { ReactComponent as FullSreenIcon } from './fullscreen.svg';
import useDoor from '../../hooks/useDoor';
import useMonster from '../../hooks/useMonster';
import dialogues from '../../data/dialogues';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import useJoysticks from '../../hooks/useJoysticks';
import Cursor from './Cursor';
import { regenerateData } from '../../utils/config';
import './Interface.css';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
}

const SPEED = 0.01;

const Dialogue = memo(({ id, text, index, onRemove }) => {
	const [displayedText, setDisplayedText] = useState('');
	const [isFadingOut, setIsFadingOut] = useState(false);

	useEffect(() => {
		let isCancelled = false;
		setDisplayedText('');

		const displayText = async () => {
			if (!isCancelled) {
				setTimeout(() => {
					setIsFadingOut(true);
					setTimeout(() => onRemove(id), 250);
				}, 3000);
			}
			for (let i = 0; i < text?.length; i++) {
				if (isCancelled) break;
				setDisplayedText((prev) => prev + text[i]);
				await new Promise((resolve) => setTimeout(resolve, SPEED));
			}
		};

		displayText();

		return () => {
			isCancelled = true;
		};
	}, [text, onRemove, id]);

	return (
		<div
			className={`dialogue-popup ${isFadingOut ? 'fade-out' : ''}`}
			style={{ transform: `translateY(-${index * 60}px)` }}
		>
			<p>{displayedText}</p>
		</div>
	);
});

const Joystick = ({ onMove, side }) => {
	const [active, setActive] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const touchIdRef = useRef(null);
	const joystickRef = useRef(null);

	const handleStart = (e) => {
		if (touchIdRef.current === null) {
			const touch = e.changedTouches[0];
			touchIdRef.current = touch.identifier;
			setActive(true);
			setPosition({ x: 0, y: 0 });
		}
	};

	const handleMove = (e) => {
		if (!active) return;

		const touch = Array.from(e.changedTouches).find(
			(t) => t.identifier === touchIdRef.current
		);

		if (touch && joystickRef.current) {
			const rect = joystickRef.current.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			const deltaX = touch.clientX - centerX;
			const deltaY = touch.clientY - centerY;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
			const maxDistance = 50;
			const moveThreshold = 5;

			if (distance > moveThreshold) {
				const angle = Math.atan2(deltaY, deltaX);
				const clampedDistance = Math.min(distance, maxDistance);
				const x = (clampedDistance * Math.cos(angle)) / maxDistance;
				const y = (clampedDistance * Math.sin(angle)) / maxDistance;

				setPosition({
					x: clampedDistance * Math.cos(angle),
					y: clampedDistance * Math.sin(angle),
				});
				onMove(side, x, y);
			} else {
				setPosition({ x: 0, y: 0 });
				onMove(side, 0, 0);
			}
		}
	};

	const handleEnd = (e) => {
		const touch = Array.from(e.changedTouches).find(
			(t) => t.identifier === touchIdRef.current
		);

		if (touch) {
			setActive(false);
			touchIdRef.current = null;
			setPosition({ x: 0, y: 0 });
			onMove(side, 0, 0);
		}
	};

	return (
		<div
			ref={joystickRef}
			className={`joystick ${side}`}
			onTouchStart={handleStart}
			onTouchMove={handleMove}
			onTouchEnd={handleEnd}
			onTouchCancel={handleEnd}
		>
			<div className="joystick-base">
				<div
					className="joystick-handle"
					style={{
						transform: `translate(${position.x}px, ${position.y}px)`,
					}}
				/>
			</div>
		</div>
	);
};

export default function Interface() {
	const { setIsLocked } = useGame();
	const isMobile = useGame((state) => state.isMobile);
	const setIsMobile = useGame((state) => state.setIsMobile);
	const leftStickRef = useJoysticks((state) => state.leftStickRef);
	const rightStickRef = useJoysticks((state) => state.rightStickRef);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);

	useEffect(() => {
		const checkMobile = () => {
			const mobileDetected =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				);
			setIsMobile(mobileDetected);
			if (mobileDetected) {
				setTutorialObjectives([true, true, true]);
			}

			setIsLocked(true);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, [setIsLocked, setIsMobile, setTutorialObjectives]);

	const currentDialogueIndex = useInterface(
		(state) => state.currentDialogueIndex
	);
	const objectives = useInterface((state) => state.interfaceObjectives);
	const interfaceAction = useInterface((state) => state.interfaceAction);
	const [activeDialogues, setActiveDialogues] = useState([]);
	const { active, progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setEnd = useGame((state) => state.setEnd);
	const end = useGame((state) => state.end);
	const loading = useGame((state) => state.loading);
	const setLoading = useGame((state) => state.setLoading);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const seedData = useGame((state) => state.seedData);

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	const handleRemove = useCallback((id) => {
		setActiveDialogues((prev) => prev.filter((dialogue) => dialogue.id !== id));
	}, []);

	useEffect(() => {
		if (
			currentDialogueIndex !== null &&
			currentDialogueIndex < dialogues.length
		) {
			const newDialogue = {
				text: dialogues[currentDialogueIndex],
				id: Date.now() + Math.random(),
			};
			setActiveDialogues((prev) => [...prev, newDialogue]);
		}
	}, [currentDialogueIndex]);

	useEffect(() => {
		let rafId;

		const updateProgress = () => {
			if (displayProgress < progress) {
				const increment = Math.max(0.1, (100 - displayProgress) / 200);
				setDisplayProgress((prev) => Math.min(progress, prev + increment));
				rafId = requestAnimationFrame(updateProgress);
			} else {
				cancelAnimationFrame(rafId);
				if (progress === 100 && displayProgress < 100) {
					setDisplayProgress(100);
				}
			}
		};

		rafId = requestAnimationFrame(updateProgress);

		return () => cancelAnimationFrame(rafId);
	}, [displayProgress, progress, active]);

	const handleJoystickMove = useCallback(
		(side, x, y) => {
			if (side === 'left') {
				leftStickRef.current = { x, y };
			} else if (side === 'right') {
				rightStickRef.current = { x, y };
			}
		},
		[leftStickRef, rightStickRef]
	);

	return (
		<div className={`interface ${loading ? 'animated' : ''}`}>
			{loading ? (
				<div
					className={`loading-page ${displayProgress === 100 ? 'ready' : ''}`}
					onClick={(e) => {
						if (displayProgress !== 100) {
							e.stopPropagation();
						} else {
							setLoading(false);
						}
					}}
				>
					<SkullHotelLogo />
					<div className="flex">
						<div className="title">SKULL HOTEL</div>
						<div className="io">.io</div>
					</div>
					<button
						className="full-screen-button"
						onClick={(e) => {
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
						}}
					>
						<FullSreenIcon />
						Full Screen
					</button>
					<div className={displayProgress !== 100 ? 'loading' : 'start'}>
						{displayProgress !== 100
							? `loading: ${displayProgress.toFixed(0)}%`
							: `click to start`}
					</div>
				</div>
			) : doneObjectives === 10 ? (
				<div className="objectives">Find the exit</div>
			) : tutorialObjectives.every((objective) => objective === true) ? (
				<div className="objectives">{doneObjectives} / 10 </div>
			) : (
				<ul className="objectives">
					<li className={tutorialObjectives[0] ? 'completed' : ''}>
						Refill soap bottles
					</li>
					<li className={tutorialObjectives[1] ? 'completed' : ''}>
						Make the bed
					</li>
					<li className={tutorialObjectives[2] ? 'completed' : ''}>
						Open the window
					</li>
				</ul>
			)}
			{!loading && isMobile && (
				<>
					<Joystick onMove={handleJoystickMove} side="left" />
					<Joystick onMove={handleJoystickMove} side="right" />
				</>
			)}
			{!loading && (
				<>
					<div className="action">{interfaceAction}</div>
					<div className="dialogue-container">
						{activeDialogues.map((dialogue, index) => (
							<Dialogue
								key={dialogue.id}
								id={dialogue.id}
								text={dialogue.text}
								index={index}
								onRemove={handleRemove}
							/>
						))}
					</div>
					<Cursor />
				</>
			)}
			{end && (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className="end-screen"
				>
					<SkullHotelLogo />
					<div className="end-message">Thank you for playing</div>
					<div
						onClick={(e) => {
							e.stopPropagation();
							setEnd(false);
							document.documentElement.click();
						}}
						className="end-screen-button"
					>
						Play again
					</div>
				</div>
			)}
			{openDeathScreen && (
				<div
					className="death-screen"
					onClick={(e) => {
						regenerateData();
						resetGame();
						setOpenDeathScreen(false);
					}}
				>
					<div className="title">You died</div>
					{seedData[playerPositionRoom]?.deathReason}
					<div className="restart">
						<div className="start">click to start</div>
					</div>
				</div>
			)}
		</div>
	);
}
