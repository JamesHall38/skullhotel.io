import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useProgress } from '@react-three/drei';
// import { ReactComponent as SkullHotelLogo } from './logo.svg';
import SkullHotelLogo from './Logo';
import Settings from './Settings';
import { FaArrowCircleDown, FaArrowCircleUp } from 'react-icons/fa';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import { TbXboxXFilled } from 'react-icons/tb';
import { TbXboxYFilled } from 'react-icons/tb';
import { TbXboxAFilled } from 'react-icons/tb';
import useDoor from '../../hooks/useDoor';
import useMonster from '../../hooks/useMonster';
import dialogues from './dialogues';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import useJoysticks from '../../hooks/useJoysticks';
import useLight from '../../hooks/useLight';
import useGridStore from '../../hooks/useGrid';
import Cursor from './Cursor';
import EndGameScreen from './EndGameScreen/EndGameScreen';
import GuestBook from './GuestBook/GuestBook';
import HowItsMade from './HowItsMade/HowItsMade';
import { regenerateData } from '../../utils/config';
import './Interface.css';
import { measurePerformance } from '../../hooks/usePerformance';
import useTextureQueue from '../../hooks/useTextureQueue';
import {
	getKeyAudioPool,
	areSoundsLoaded,
	preloadSounds,
} from '../../utils/audio';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
	useGame.getState().setPlayIntro(true);
	useLight.getState().restart();
}

const Dialogue = memo(({ id, text, index, onRemove }) => {
	const [displayedText, setDisplayedText] = useState('');
	const [isFadingOut, setIsFadingOut] = useState(false);
	const [soundsReady, setSoundsReady] = useState(false);
	const animationFrameRef = useRef();
	const accumulatedTimeRef = useRef(0);
	const textIndexRef = useRef(0);
	const currentAudioIndex = useRef(0);
	const keySoundsRef = useRef(null);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				keySoundsRef.current = getKeyAudioPool();
				if (keySoundsRef.current) {
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (keySoundsRef.current) {
				keySoundsRef.current.forEach((audio) => {
					audio.pause();
					audio.currentTime = 0;
				});
			}
		};
	}, []);

	useEffect(() => {
		if (!soundsReady) return;

		let isCancelled = false;
		let lastTime = performance.now();
		setDisplayedText('');
		textIndexRef.current = 0;

		const CHARS_PER_SECOND = 20;
		const TIME_PER_CHAR = 1000 / CHARS_PER_SECOND;
		const DISPLAY_DURATION = 5000;

		const animate = (currentTime) => {
			if (isCancelled) return;

			const deltaTime = currentTime - lastTime;
			lastTime = currentTime;

			accumulatedTimeRef.current += deltaTime;

			while (accumulatedTimeRef.current >= TIME_PER_CHAR) {
				if (textIndexRef.current < text.length) {
					const currentChar = text[textIndexRef.current];

					if (currentChar !== ' ' && keySoundsRef.current) {
						try {
							const audio = keySoundsRef.current[currentAudioIndex.current];
							audio.currentTime = 0;
							audio.play().catch(console.warn);
							currentAudioIndex.current =
								(currentAudioIndex.current + 1) % keySoundsRef.current.length;
						} catch (error) {
							console.warn('Audio playback failed:', error);
						}
					}

					setDisplayedText((prev) => prev + currentChar);
					textIndexRef.current++;
				}
				accumulatedTimeRef.current -= TIME_PER_CHAR;
			}

			if (textIndexRef.current < text.length) {
				animationFrameRef.current = requestAnimationFrame(animate);
			} else {
				setTimeout(() => {
					if (!isCancelled) {
						setIsFadingOut(true);
						setTimeout(() => {
							if (!isCancelled) {
								onRemove(id);
							}
						}, 250);
					}
				}, DISPLAY_DURATION);
			}
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			isCancelled = true;
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (keySoundsRef.current) {
				keySoundsRef.current.forEach((audio) => {
					audio.pause();
					audio.currentTime = 0;
				});
			}
		};
	}, [text, onRemove, id, soundsReady]);

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

const DRAW_CALLS_STABILIZATION_TIME = 3000;

export default function Interface() {
	const { setIsLocked } = useGame();
	const isMobile = useGame((state) => state.isMobile);
	const setIsMobile = useGame((state) => state.setIsMobile);
	const leftStickRef = useJoysticks((state) => state.leftStickRef);
	const rightStickRef = useJoysticks((state) => state.rightStickRef);
	const setControl = useJoysticks((state) => state.setControl);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);
	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const setGameStartTime = useGame((state) => state.setGameStartTime);
	const { progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);
	const [loading, setLoading] = useState(true);

	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setEnd = useGame((state) => state.setEnd);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const setReleaseMobileClick = useGame((state) => state.setReleaseMobileClick);
	const end = useGame((state) => state.end);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const incrementRealDeaths = useGame((state) => state.incrementRealDeaths);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const seedData = useGame((state) => state.seedData);
	const setIsPlaying = useGame((state) => state.setIsPlaying);
	const [assetsLoaded, setAssetsLoaded] = useState(false);
	const [performanceMeasured, setPerformanceMeasured] = useState(false);
	const setPerformanceMode = useGame((state) => state.setPerformanceMode);
	const [drawCallsStabilized, setDrawCallsStabilized] = useState(false);
	const [loadedTextureNumber, setLoadedTextureNumber] = useState(0);

	const setIsListening = useGame((state) => state.setIsListening);
	const setCursor = useInterface((state) => state.setCursor);
	const [activeButtons, setActiveButtons] = useState({
		rightClick: false,
		leftClick: false,
		jump: false,
		crouch: false,
	});

	const currentDialogueIndex = useInterface(
		(state) => state.currentDialogueIndex
	);
	const customMessage = useGame((state) => state.customDeathMessage);
	const objectives = useInterface((state) => state.interfaceObjectives);
	const interfaceAction = useInterface((state) => state.interfaceAction);
	const [activeDialogues, setActiveDialogues] = useState([]);
	const deviceMode = useGame((state) => state.deviceMode);
	const [isRestarting, setIsRestarting] = useState(false);

	const queue = useTextureQueue((state) => state.queues);
	const oldQueue = useRef(queue);

	const [lastDeathMessage, setLastDeathMessage] = useState(null);

	const fadeToBlack = useInterface((state) => state.fadeToBlack);

	useEffect(() => {
		if (playerPositionRoom !== null && playerPositionRoom >= 0) {
			const currentRoom = Object.values(seedData)[playerPositionRoom];
			const message =
				customMessage ||
				(currentRoom?.isRaid
					? 'If you hear a client knocking at the door, hide until they leave'
					: currentRoom?.deathReason);
			setLastDeathMessage(message);
		}
	}, [playerPositionRoom, seedData, customMessage]);

	useEffect(() => {
		const hasQueueChanged = Object.keys(queue).some((key) => {
			return queue[key].queue.length !== oldQueue.current[key]?.queue.length;
		});

		if (hasQueueChanged) {
			oldQueue.current = queue;
			setLoadedTextureNumber((value) => value + 1);
		}
	}, [queue]);

	useEffect(() => {
		const texturesDrawCalls = (loadedTextureNumber / 29) * 85;
		const modelsLoading =
			(Math.min(progress, 80) / 2 + (Math.max(progress - 80, 0) * 5) / 2) / 10;

		const calculatedProgress = Math.min(
			Math.max(texturesDrawCalls + modelsLoading, displayProgress),
			95
		);

		if (calculatedProgress >= 95) {
			const initAudio = async () => {
				try {
					await preloadSounds();
					setDisplayProgress(100);
				} catch (error) {
					console.error('Error loading sounds:', error);
					setDisplayProgress(100);
				}
			};

			initAudio();
		} else if (calculatedProgress < 95) {
			setDisplayProgress(calculatedProgress);
		}
	}, [loadedTextureNumber, progress, displayProgress]);

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	const handleRemove = useCallback((id) => {
		setActiveDialogues((prev) => prev.filter((dialogue) => dialogue.id !== id));
	}, []);

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

	useEffect(() => {
		const checkMobile = () => {
			const mobileDetected =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				);
			setIsMobile(mobileDetected);
			setIsLocked(true);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, [setIsLocked, setIsMobile, setTutorialObjectives]);

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
		if (displayProgress !== 100) {
			setIsPlaying(true);
			setTimeout(() => {
				setAssetsLoaded(true);
				setTimeout(() => {
					setDrawCallsStabilized(true);
				}, DRAW_CALLS_STABILIZATION_TIME);
			}, 1000);
		}
	}, [displayProgress, assetsLoaded, setIsPlaying]);

	useEffect(() => {
		if (
			assetsLoaded &&
			drawCallsStabilized &&
			!performanceMeasured &&
			!isMobile
		) {
			measurePerformance().then((isHighPerformance) => {
				setPerformanceMode(isHighPerformance);
				setPerformanceMeasured(true);
			});
		}
	}, [
		assetsLoaded,
		drawCallsStabilized,
		performanceMeasured,
		setPerformanceMode,
		isMobile,
	]);

	useEffect(() => {
		let timeoutId;

		const resetMobileClick = () => {
			timeoutId = setTimeout(() => {
				if (!activeButtons.leftClick) {
					setMobileClick(false);
				}
			}, 10);
		};

		resetMobileClick();

		return () => {
			clearTimeout(timeoutId);
		};
	}, [activeButtons.leftClick, setMobileClick]);

	useEffect(() => {
		const fadeElement = document.querySelector('.fade-to-black');
		if (fadeElement) {
			if (fadeToBlack === 0) {
				setTimeout(() => {
					fadeElement.style.visibility = 'hidden';
				}, 3000);
			} else {
				fadeElement.style.visibility = 'visible';
			}
		}
	}, [fadeToBlack]);

	useEffect(() => {
		if (!openDeathScreen || deviceMode !== 'gamepad') return;

		const checkGamepadXButton = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			for (const gamepad of gamepads) {
				if (gamepad && gamepad.connected) {
					const xButtonPressed = gamepad.buttons[2]?.pressed;
					if (xButtonPressed && !isRestarting) {
						setIsRestarting(true);
						setTimeout(() => {
							resetGame();
							regenerateData();
							useGridStore.getState().initializeIfNeeded();
							setTimeout(() => {
								setOpenDeathScreen(false);
								setIsRestarting(false);
							}, 100);
						}, 500);
					}
				}
			}
		};

		const interval = setInterval(checkGamepadXButton, 100);
		return () => clearInterval(interval);
	}, [openDeathScreen, deviceMode, setOpenDeathScreen, isRestarting]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		if (!openDeathScreen && !end && !loading) return;

		const handleGamepadNavigation = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			for (const gamepad of gamepads) {
				if (gamepad && gamepad.connected) {
					const aButtonPressed = gamepad.buttons[0]?.pressed;

					if (openDeathScreen && aButtonPressed && !isRestarting) {
						incrementRealDeaths();
						setIsRestarting(true);
						setTimeout(() => {
							resetGame();
							regenerateData();
							useGridStore.getState().initializeIfNeeded();
							setTimeout(() => {
								setOpenDeathScreen(false);
								setIsRestarting(false);
							}, 100);
						}, 500);
						return;
					}

					if (loading && displayProgress === 100 && aButtonPressed) {
						setLoading(false);
						setPlayIntro(true);
						setGameStartTime();
						return;
					}
				}
			}
		};

		const interval = setInterval(handleGamepadNavigation, 10);
		return () => clearInterval(interval);
	}, [
		openDeathScreen,
		end,
		loading,
		deviceMode,
		displayProgress,
		setPlayIntro,
		setOpenDeathScreen,
		setEnd,
		setGameStartTime,
		isRestarting,
	]);

	return (
		<div className={`interface ${loading ? 'animated' : ''}`}>
			{/* Fade to black effect */}
			<div
				className="fade-to-black"
				style={{
					opacity: fadeToBlack,
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					backgroundColor: 'black',
					zIndex: 1000,
					pointerEvents: 'none',
					transition: fadeToBlack < 1 ? 'opacity 3s ease-out' : 'none',
				}}
			/>

			<Settings />
			{loading ? (
				<div
					className={`loading-page ${displayProgress === 100 ? 'ready' : ''}`}
					onClick={(e) => {
						if (displayProgress !== 100) {
							e.stopPropagation();
						} else {
							setLoading(false);
							setPlayIntro(true);
							setGameStartTime();
							// setIsPlaying(true);
						}
					}}
				>
					<SkullHotelLogo />
					<div className="flex">
						<div className="title">SKULL HOTEL</div>
						{/* <div className="io">.io</div> */}
					</div>
					<div className={displayProgress !== 100 ? 'loading' : 'start'}>
						{displayProgress !== 100
							? `loading: ${displayProgress.toFixed(0)}%`
							: `click to start`}
					</div>
				</div>
			) : doneObjectives === 10 ? (
				<div className="objectives">Find the exit</div>
			) : tutorialObjectives.every((objective) => objective === true) ? (
				<div className="objectives">
					{doneObjectives} / {roomCount / 2}{' '}
				</div>
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
				<div
					className="mobile-interface"
					onPointerDown={(e) => e.stopPropagation()}
					onPointerUp={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="mobile-buttons left">
						<button
							className={`mobile-button top ${
								activeButtons.rightClick ? 'active' : ''
							}`}
							onTouchStart={() => {
								setActiveButtons((prev) => ({ ...prev, rightClick: true }));
								setIsListening(true);
								setCursor('listening');
							}}
							onTouchEnd={() => {
								setActiveButtons((prev) => ({ ...prev, rightClick: false }));
								setIsListening(false);
								setCursor(null);
							}}
						>
							<TbXboxYFilled />
						</button>
						<button
							className={`mobile-button bottom ${
								activeButtons.leftClick ? 'active' : ''
							}`}
							onTouchStart={() => {
								setActiveButtons((prev) => ({ ...prev, leftClick: true }));
								const pointerEvent = new PointerEvent('pointerdown', {
									bubbles: true,
									cancelable: true,
									pointerType: 'touch',
									button: 0,
									clientX: window.innerWidth / 2,
									clientY: window.innerHeight / 2,
								});
								window.dispatchEvent(pointerEvent);
								const clickEvent = new MouseEvent('click', {
									bubbles: true,
									cancelable: true,
									view: window,
									clientX: window.innerWidth / 2,
									clientY: window.innerHeight / 2,
								});
								window.dispatchEvent(clickEvent);
								setMobileClick(true);

								const cursor = useInterface.getState().cursor;
								if (cursor?.includes('clean')) {
									const event = new CustomEvent('startProgress');
									document.dispatchEvent(event);
								}
							}}
							onTouchEnd={() => {
								setActiveButtons((prev) => ({ ...prev, leftClick: false }));
								const pointerEvent = new PointerEvent('pointerup', {
									bubbles: true,
									cancelable: true,
									pointerType: 'touch',
									button: 0,
									clientX: window.innerWidth / 2,
									clientY: window.innerHeight / 2,
								});
								window.dispatchEvent(pointerEvent);
								setReleaseMobileClick(true);
							}}
						>
							<TbXboxXFilled />
						</button>
					</div>

					<div className="mobile-buttons right">
						<button
							className={`mobile-button top ${
								activeButtons.jump ? 'active' : ''
							}`}
							onTouchStart={() => {
								setActiveButtons((prev) => ({ ...prev, jump: true }));
								setControl('jump', true);
							}}
							onTouchEnd={() => {
								setActiveButtons((prev) => ({ ...prev, jump: false }));
								setControl('jump', false);
							}}
						>
							<FaArrowCircleUp />
						</button>
						<button
							className={`mobile-button bottom ${
								activeButtons.crouch ? 'active' : ''
							}`}
							onTouchStart={() => {
								setActiveButtons((prev) => ({ ...prev, crouch: true }));
								setControl('crouch', true);
							}}
							onTouchEnd={() => {
								setActiveButtons((prev) => ({ ...prev, crouch: false }));
								setControl('crouch', false);
							}}
						>
							<FaArrowCircleDown />
						</button>
					</div>

					<Joystick onMove={handleJoystickMove} side="left" />
					<Joystick onMove={handleJoystickMove} side="right" />
				</div>
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
							resetGame();
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
					onClick={() => {
						if (isRestarting) return;

						setIsRestarting(true);
						incrementRealDeaths();

						setTimeout(() => {
							resetGame();
							regenerateData();
							useGridStore.getState().initializeIfNeeded();
							setTimeout(() => {
								setOpenDeathScreen(false);
								setIsRestarting(false);
							}, 100);
						}, 500);
					}}
				>
					<div className="title">You died</div>
					<div className="death-message">{lastDeathMessage}</div>
					<div className="start">
						{deviceMode === 'gamepad' ? (
							<>
								<TbXboxAFilled
									style={{ verticalAlign: 'middle', marginRight: '5px' }}
								/>{' '}
								or{' '}
								<TbXboxXFilled
									style={{
										verticalAlign: 'middle',
										marginLeft: '5px',
										marginRight: '5px',
									}}
								/>{' '}
								to start
							</>
						) : (
							<>{isRestarting ? 'Restarting...' : 'click to start'}</>
						)}
					</div>
				</div>
			)}

			<EndGameScreen />

			<GuestBook />
			<HowItsMade />
		</div>
	);
}
