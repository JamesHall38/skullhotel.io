import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import SkullHotelLogo from './Logo';
import Settings from './Settings/Settings';
import { HiMiniArrowDownCircle, HiMiniArrowUpCircle } from 'react-icons/hi2';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import AnimatedObjectives from './AnimatedObjectives';
import { TbXboxXFilled } from 'react-icons/tb';
import { TbXboxYFilled } from 'react-icons/tb';
import useDoor from '../../hooks/useDoor';
import useMonster from '../../hooks/useMonster';
import dialogues from './dialogues';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import useJoysticks from '../../hooks/useJoysticks';
import useLight from '../../hooks/useLight';
import useLocalization from '../../hooks/useLocalization';
import Cursor from './Cursor';
import EndGameScreen from './EndGameScreen/EndGameScreen';
import GuestBook from './GuestBook/GuestBook';
import HowItsMade from './HowItsMade/HowItsMade';
import DeathScreen from './DeathScreen/DeathScreen';
import './Interface.css';
import { measurePerformance } from '../../hooks/usePerformance';
import useTextureQueue from '../../hooks/useTextureQueue';
import LoadingScreen from './Loading/LoadingScreen';
import {
	getKeyAudioPool,
	areSoundsLoaded,
	preloadSounds,
} from '../../utils/audio';
import {
	isPointerLocked,
	exitPointerLock,
	requestPointerLock,
} from '../../utils/pointerLock';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
	useGame.getState().setPlayIntro(true);
	useLight.getState().restart();
	useInterface.getState().setIsSettingsOpen(false);
	useInterface.getState().setTutorialObjectives([true, true, true]);
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
	const { t } = useLocalization();

	// Translate text if it's a translation key
	const finalText =
		text.startsWith('game.dialogues.') || text.startsWith('game.deathReasons.')
			? t(text)
			: text;

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
				if (textIndexRef.current < finalText.length) {
					const currentChar = finalText[textIndexRef.current];

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

			if (textIndexRef.current < finalText.length) {
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
	}, [finalText, onRemove, id, soundsReady]);

	return (
		<div
			className={`dialogue-popup ${isFadingOut ? 'fade-out' : ''}`}
			style={{ transform: `translateY(-${index * 5}rem)` }}
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

const AnimatedObjectiveText = ({ children, prevText }) => {
	const [currentText, setCurrentText] = useState(children);
	const [oldText, setOldText] = useState(prevText);
	const [isTransitioning, setIsTransitioning] = useState(!!prevText);
	const [svgCompleted, setSvgCompleted] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isFadingOut, setIsFadingOut] = useState(false);
	const [svgKey, setSvgKey] = useState(`objective-${Date.now()}`);
	const contentRef = useRef(null);

	useEffect(() => {
		if (!isTransitioning) {
			setCurrentText(children);
		}
	}, [children, isTransitioning]);

	useEffect(() => {
		if (!prevText) return;

		setIsTransitioning(true);
		setOldText(prevText);

		const step1 = setTimeout(() => {
			setIsStrikethrough(true);
		}, 50);

		const step2 = setTimeout(() => {
			setSvgCompleted(true);
		}, 500);

		const step3 = setTimeout(() => {
			setIsFadingOut(true);
		}, 800);

		const step4 = setTimeout(() => {
			setCurrentText(children);
			setSvgKey(`objective-${Date.now()}`);
			setSvgCompleted(false);
			setIsStrikethrough(false);
			setIsFadingOut(false);
			setIsTransitioning(false);
		}, 1300);

		return () => {
			clearTimeout(step1);
			clearTimeout(step2);
			clearTimeout(step3);
			clearTimeout(step4);
		};
	}, [prevText, children]);

	return (
		<div className="animated-objective-text">
			<AnimatedObjectives
				key={svgKey}
				animationKey={svgKey}
				completed={svgCompleted}
			/>
			{isTransitioning ? (
				<div className="text-container">
					{oldText && (
						<span
							ref={contentRef}
							className={`text-content old ${
								isStrikethrough ? 'strikethrough' : ''
							} ${isFadingOut ? 'fade-out' : ''}`}
						>
							{oldText}
						</span>
					)}
				</div>
			) : (
				<div className="text-container">
					<span className="text-content">{currentText}</span>
				</div>
			)}
		</div>
	);
};

const AnimatedObjectiveItem = ({ objective, index }) => {
	const [oldText, setOldText] = useState(null);
	const [currentText, setCurrentText] = useState(objective.text);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [svgCompleted, setSvgCompleted] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isFadingOut, setIsFadingOut] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const oldTextRef = useRef(null);
	const [svgKey, setSvgKey] = useState(`${index}-initial`);
	const setCustomTutorialObjectives = useInterface(
		(state) => state.setCustomTutorialObjectives
	);
	const { t } = useLocalization();

	useEffect(() => {
		if (objective.text !== currentText && !isTransitioning && !isAnimating) {
			setIsAnimating(true);

			setIsTransitioning(true);
			setOldText(currentText);

			setTimeout(() => {
				setIsStrikethrough(true);
			}, 50);

			setTimeout(() => {
				setSvgCompleted(true);
			}, 500);

			setTimeout(() => {
				setIsFadingOut(true);
			}, 800);

			setTimeout(() => {
				setCurrentText(objective.text);

				setSvgKey(`${index}-${Date.now()}`);

				setSvgCompleted(false);
				setIsStrikethrough(false);
				setIsFadingOut(false);

				setTimeout(() => {
					setIsTransitioning(false);
					setIsAnimating(false);
				}, 50);
			}, 1300);
		}
	}, [
		objective.text,
		currentText,
		index,
		isTransitioning,
		isAnimating,
		setCustomTutorialObjectives,
		t,
	]);

	return (
		<li key={index} className={objective.completed ? 'completed' : ''}>
			<AnimatedObjectives
				key={svgKey}
				animationKey={svgKey}
				completed={svgCompleted || objective.completed}
			/>
			{isTransitioning ? (
				<div className="text-container">
					{oldText && (
						<span
							ref={oldTextRef}
							className={`text-content old ${
								isStrikethrough ? 'strikethrough' : ''
							} ${isFadingOut ? 'fade-out' : ''}`}
						>
							{oldText}
						</span>
					)}
				</div>
			) : (
				<div className="text-container">
					<span className="text-content">{currentText}</span>
				</div>
			)}
		</li>
	);
};

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
	const { t, currentLanguage } = useLocalization();

	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const setEnd = useGame((state) => state.setEnd);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const setReleaseMobileClick = useGame((state) => state.setReleaseMobileClick);
	const end = useGame((state) => state.end);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const setIsPlaying = useGame((state) => state.setIsPlaying);
	const [assetsLoaded, setAssetsLoaded] = useState(false);
	const [performanceMeasured, setPerformanceMeasured] = useState(false);
	const setPerformanceMode = useGame((state) => state.setPerformanceMode);
	const [drawCallsStabilized, setDrawCallsStabilized] = useState(false);
	const [loadedTextureNumber, setLoadedTextureNumber] = useState(0);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const deviceMode = useGame((state) => state.deviceMode);
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);
	const isEndAnimationPlaying = useGame((state) => state.isEndAnimationPlaying);

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
	const objectives = useInterface((state) => state.interfaceObjectives);
	const interfaceAction = useInterface((state) => state.interfaceAction);
	const customTutorialObjectives = useInterface(
		(state) => state.customTutorialObjectives
	);
	const isTutorialCompleted = useInterface(
		(state) => state.isTutorialCompleted
	);
	const [activeDialogues, setActiveDialogues] = useState([]);
	const setIsSettingsOpen = useInterface((state) => state.setIsSettingsOpen);
	const isSettingsOpen = useInterface((state) => state.isSettingsOpen);

	const queue = useTextureQueue((state) => state.queues);
	const oldQueue = useRef(queue);

	const fadeToBlack = useInterface((state) => state.fadeToBlack);

	const [prevObjectiveText, setPrevObjectiveText] = useState(null);
	const [showFindExit, setShowFindExit] = useState(false);
	const prevDoneObjectives = useRef(0);

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
		const texturesDrawCalls = (loadedTextureNumber / 38) * 85;
		const modelsLoading =
			(Math.min(progress, 80) / 2 + (Math.max(progress - 80, 0) * 5) / 2) / 10;

		const calculatedProgress = Math.min(
			Math.max(texturesDrawCalls + modelsLoading, displayProgress),
			95
		);

		if (calculatedProgress >= 95) {
			const initAudio = async () => {
				try {
					setDisplayProgress(100);
					await preloadSounds();
				} catch (error) {
					setDisplayProgress(100);
					console.error('Error loading sounds:', error);
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
		if (deviceMode !== 'gamepad') return;

		if (!openDeathScreen && !end && !loading) return;

		const handleGamepadNavigation = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			for (const gamepad of gamepads) {
				if (gamepad && gamepad.connected) {
					const aButtonPressed = gamepad.buttons[0]?.pressed;

					if (loading && displayProgress === 100 && aButtonPressed) {
						setIsGameplayActive(true);
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
		setIsGameplayActive,
	]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === 'Tab') {
				event.preventDefault();
				if (isSettingsOpen) {
					setIsSettingsOpen(false);
				} else if (
					!openDeathScreen &&
					!isEndScreen &&
					!end &&
					!isAnyPopupOpen
				) {
					setIsSettingsOpen(true);
				} else if (loading) {
					setIsSettingsOpen(true);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [
		loading,
		openDeathScreen,
		isEndScreen,
		end,
		setIsSettingsOpen,
		isSettingsOpen,
		isAnyPopupOpen,
	]);

	useEffect(() => {
		if (openDeathScreen && deviceMode === 'keyboard') {
			if (isPointerLocked()) {
				exitPointerLock();
			}
		}
	}, [openDeathScreen, deviceMode]);

	useEffect(() => {
		if (end && deviceMode === 'keyboard') {
			if (isPointerLocked()) {
				exitPointerLock();
			}
		}
	}, [end, deviceMode]);

	useEffect(() => {
		if (openDeathScreen) {
			setIsGameplayActive(false);
		}
	}, [openDeathScreen, setIsGameplayActive]);

	useEffect(() => {
		if (end) {
			setIsGameplayActive(false);
		}
	}, [end, setIsGameplayActive]);

	useEffect(() => {
		if (doneObjectives >= roomCount / 2 && !showFindExit) {
			setPrevObjectiveText(`${doneObjectives} / ${roomCount / 2}`);
			setShowFindExit(true);
		}

		prevDoneObjectives.current = doneObjectives;
	}, [doneObjectives, roomCount, showFindExit]);

	return (
		<div className={`interface ${loading ? 'animated' : ''}`}>
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

			{!isEndAnimationPlaying && <Settings loading={loading} />}
			{loading ? (
				<LoadingScreen onStart={() => setLoading(false)} />
			) : isEndAnimationPlaying ? null : doneObjectives >= roomCount / 2 ? (
				<div className="objectives">
					<div className="objectives-flex">
						<AnimatedObjectiveText prevText={prevObjectiveText}>
							{t('ui.objectives.findExit')}
						</AnimatedObjectiveText>
					</div>
				</div>
			) : isTutorialCompleted ? (
				<div className="objectives">
					<div className="objectives-flex">
						<AnimatedObjectives />
						<div className="objectives-count">
							{doneObjectives} / {roomCount / 2}{' '}
						</div>
					</div>
				</div>
			) : (
				<div className="objectives">
					<div>
						{customTutorialObjectives?.map((objective, index) => (
							<AnimatedObjectiveItem
								key={index}
								objective={objective}
								index={index}
							/>
						))}
					</div>
				</div>
			)}
			{!loading && isMobile && !isEndAnimationPlaying && (
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

								setTimeout(() => {
									const cursor = useInterface.getState().cursor;
									if (cursor?.includes('clean')) {
										const event = new CustomEvent('startProgress');
										document.dispatchEvent(event);
									}
								}, 50);
							}}
							onTouchEnd={() => {
								setActiveButtons((prev) => ({ ...prev, leftClick: false }));
								setTimeout(() => {
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
								}, 50);
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
							<HiMiniArrowUpCircle />
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
							<HiMiniArrowDownCircle />
						</button>
					</div>

					<Joystick onMove={handleJoystickMove} side="left" />
					<Joystick onMove={handleJoystickMove} side="right" />
				</div>
			)}
			{!loading && !isSettingsOpen && (
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
					<div className="end-message">
						{t('game.status.thankYouForPlaying')}
					</div>
					<div
						onClick={(e) => {
							e.stopPropagation();
							resetGame();
							setEnd(false);
							setIsGameplayActive(true);
							document.documentElement.click();

							if (deviceMode === 'keyboard') {
								const canvas = document.querySelector('canvas');
								if (canvas && !isPointerLocked()) {
									requestPointerLock(canvas);
								}
							}

							setTimeout(() => {
								useInterface.getState().setCurrentDialogueIndex(1);
								setTimeout(() => {
									useInterface.getState().setCurrentDialogueIndex(null);
								}, 3000);
							}, 1500);
						}}
						className="end-screen-button"
					>
						{t('game.status.playAgain')}
					</div>
				</div>
			)}

			<DeathScreen />

			<EndGameScreen />

			<GuestBook />
			<HowItsMade />
		</div>
	);
}
