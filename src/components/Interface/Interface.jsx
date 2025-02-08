import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useProgress } from '@react-three/drei';
// import { ReactComponent as SkullHotelLogo } from './logo.svg';
import SkullHotelLogo from './Logo';
import Settings from './Settings';
import { FaArrowCircleDown, FaArrowCircleUp } from 'react-icons/fa';
import { TbXboxXFilled } from 'react-icons/tb';
import { TbXboxYFilled } from 'react-icons/tb';
import useDoor from '../../hooks/useDoor';
import useMonster from '../../hooks/useMonster';
import dialogues from '../../data/dialogues';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import useJoysticks from '../../hooks/useJoysticks';
import useLight from '../../hooks/useLight';
import Cursor from './Cursor';
import { regenerateData } from '../../utils/config';
import './Interface.css';
import { measurePerformance } from '../../hooks/usePerformance';
import useTextureQueue from '../../hooks/useTextureQueue';

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
	const animationFrameRef = useRef();
	const accumulatedTimeRef = useRef(0);
	const textIndexRef = useRef(0);

	const keySound = useMemo(() => {
		const audio = new Audio('/sounds/key.mp3');
		return audio;
	}, []);

	useEffect(() => {
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

					if (currentChar !== ' ') {
						try {
							const audioClone = keySound.cloneNode();
							audioClone.volume = 0.25;
							audioClone.play().catch(console.warn);
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

		keySound.load();
		keySound.addEventListener(
			'loadedmetadata',
			() => {
				animationFrameRef.current = requestAnimationFrame(animate);
			},
			{ once: true }
		);

		return () => {
			isCancelled = true;
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [text, onRemove, id, keySound]);

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
	const { progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);
	const [loading, setLoading] = useState(true);

	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setEnd = useGame((state) => state.setEnd);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const setReleaseMobileClick = useGame((state) => state.setReleaseMobileClick);
	const end = useGame((state) => state.end);
	// const loading = useGame((state) => state.loading);
	// const setLoading = useGame((state) => state.setLoading);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
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
	const objectives = useInterface((state) => state.interfaceObjectives);
	const interfaceAction = useInterface((state) => state.interfaceAction);
	const [activeDialogues, setActiveDialogues] = useState([]);

	// Track texture loading progress

	const queue = useTextureQueue((state) => state.queues);
	const oldQueue = useRef(queue);

	// Track texture loading progress
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
		const texturesDrawCalls = (loadedTextureNumber / 44) * 50; // 50% // 44 textures
		const modelsLoading = (progress / 10) * 5; // 100 / 10 = 10 % * 5 = 50%
		const currentProgress = Math.min(
			Math.max(texturesDrawCalls + modelsLoading, displayProgress),
			100
		);
		if (currentProgress === 100) {
			setTimeout(() => {
				setDisplayProgress(currentProgress);
			}, 1000);
		} else {
			setDisplayProgress(currentProgress);
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

	return (
		<div className={`interface ${loading ? 'animated' : ''}`}>
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
