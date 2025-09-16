import {
	useEffect,
	Suspense,
	useMemo,
	useRef,
	useState,
	useCallback,
} from 'react';
import { KeyboardControls } from '@react-three/drei';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import Interface from './components/Interface/Interface';
import './style.css';
import useGame from './hooks/useGame';
import useInterface from './hooks/useInterface';
import useDoor from './hooks/useDoor';
import useMonster from './hooks/useMonster';
import useGridStore from './hooks/useGrid';
import useLight from './hooks/useLight';
import PostProcessing from './components/PostProcessing';

import { Perf } from 'r3f-perf';
import { Leva, useControls, button } from 'leva';

import CustomPointerLockControls from './components/CustomPointerLockControls';

// Models
import Reception from './components/Reception/Reception';
import Room from './components/Room/Room';
import CorridorStart from './components/Corridor/CorridorStart';
import CorridorMiddles from './components/Corridor/CorridorMiddles';
import CorridorEnd from './components/Corridor/CorridorEnd';
// Doors
import RoomDoor from './components/Doors/RoomDoor';
import BathroomDoor from './components/Doors/BathroomDoor';
import NightstandDoor from './components/Doors/NightstandDoor';
import DeskDoor from './components/Doors/DeskDoor';
// Tutorial
import Tutorial from './components/Tutorial/Tutorial';
// Objectives
import Window from './components/Objectives/Window';
import Bottles from './components/Objectives/Bottles';
import Bedsheets from './components/Objectives/Bedsheets';
// Curtains
import BathroomCurtain from './components/Curtains/BathroomCurtain';
import RoomCurtain from './components/Curtains/RoomCurtain';
// Game
import Player from './components/Player/Player';
import Monster from './components/Monster/Monster';

import Triggers from './components/Monster/Triggers/Triggers';
import Grid from './components/Grid';
import ReceptionDoors from './components/Reception/ReceptionDoors';
import Sound from './components/Sound';
import { regenerateData } from './utils/config';
import generateSeedData from './utils/generateSeedData';
import ListeningMode from './components/Player/ListeningMode';
import levelData from './components/Monster/Triggers/levelData';
import { preloadSounds } from './utils/audio';
import useGameplaySettings from './hooks/useGameplaySettings';
import useSettings from './hooks/useSettings';
import ShadowManager from './components/ShadowManager';
import EndGameAnimation from './components/EndGameAnimation';
import { isPointerLocked, exitPointerLock } from './utils/pointerLock';
import { isElectron } from './utils/platform';

const generateLevelOptions = () => {
	const options = {
		None: null,
	};

	Object.keys(levelData).forEach((key) => {
		const label = key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase());
		options[label] = key;
	});

	return options;
};

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
	useGame.getState().setPlayIntro(true);
	useLight.getState().restart();
}

const CORRIDORLENGTH = 5.95;

function App() {
	const isMobile = useGame((state) => state.isMobile);
	const deviceMode = useGame((state) => state.deviceMode);
	const setSeedData = useGame((state) => state.setSeedData);
	const setIsLocked = useGame((state) => state.setIsLocked);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const disableControls = useGame((state) => state.disableControls);
	const setEnd = useGame((state) => state.setEnd);
	const realPlayerPositionRoom = useGame(
		(state) => state.realPlayerPositionRoom
	);
	const setRealPlayerPositionRoom = useGame(
		(state) => state.setRealPlayerPositionRoom
	);
	const { camera } = useThree();
	const initializeIfNeeded = useGridStore((state) => state.initializeIfNeeded);
	const controlsRef = useRef();
	const [isStable, setIsStable] = useState(false);
	const frameCount = useRef(0);
	const lastTime = useRef(performance.now());
	const {
		roomCount,
		emptyRoomPercentage,
		hideoutPercentage,
		landminePercentage,
		claymorePercentage,
		hunterPercentage,
		sonarPercentage,
		raidPercentage,
		randomRoomPercentage,
		setRoomCount,
		setEmptyRoomPercentage,
		setHideoutPercentage,
		setLandminePercentage,
		setClaymorePercentage,
		setHunterPercentage,
		setSonarPercentage,
		setRaidPercentage,
		setRandomRoomPercentage,
	} = useGameplaySettings();
	const introIsPlaying = useGame((state) => state.introIsPlaying);
	const hasIntroBeenPlayedRef = useRef(false);

	useEffect(() => {
		const audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();

		const initAudio = async () => {
			try {
				if (audioContext.state === 'suspended') {
					await audioContext.resume();
				}
				await preloadSounds();
			} catch (error) {
				console.error('Error loading sounds:', error);
			}
		};

		const handleFirstInteraction = () => {
			initAudio();
			document.removeEventListener('click', handleFirstInteraction);
		};

		document.addEventListener('click', handleFirstInteraction);
		return () => {
			document.removeEventListener('click', handleFirstInteraction);
			audioContext.close();
		};
	}, []);

	const duplicateComponents = (Component) => {
		return [...Array(roomCount / 2)].map((_, i) => (
			<group key={i}>
				<Component roomNumber={i} />
				<Component roomNumber={i + roomCount / 2} />
			</group>
		));
	};

	const position = useMemo(() => {
		let calculatedPosition = [0, 0, 0];
		if (camera.position.x > 8 && Math.round(camera.position.z) === 3) {
			calculatedPosition = [24.5, 0, 14.5];
		}
		return calculatedPosition;
	}, [camera]);

	const { selectedRoom } = useControls({
		selectedRoom: {
			options: generateLevelOptions(),
			value: null,
			label: 'Select Room',
		},
	});

	useEffect(() => {
		const newSeedData = selectedRoom
			? {
					[selectedRoom]: {
						...levelData[selectedRoom],
						type: selectedRoom,
					},
			  }
			: generateSeedData(false, selectedRoom);

		setSeedData(newSeedData);
		initializeIfNeeded();
	}, [
		initializeIfNeeded,
		roomCount,
		emptyRoomPercentage,
		hideoutPercentage,
		landminePercentage,
		claymorePercentage,
		hunterPercentage,
		sonarPercentage,
		raidPercentage,
		selectedRoom,
		setSeedData,
	]);

	useEffect(() => {
		const controls = controlsRef.current;

		const handleLock = () => setIsLocked(true);
		const handleUnlock = () => {
			if (deviceMode === 'keyboard') {
				setIsLocked(false);
			}
		};

		if (controls) {
			controls.addEventListener('lock', handleLock);
			controls.addEventListener('unlock', handleUnlock);

			return () => {
				controls.removeEventListener('lock', handleLock);
				controls.removeEventListener('unlock', handleUnlock);
			};
		}
	}, [setIsLocked, deviceMode]);

	useEffect(() => {
		if (
			deviceMode === 'keyboard' &&
			controlsRef.current &&
			!openDeathScreen &&
			!disableControls &&
			!useGame.getState().isEndScreen
		) {
			controlsRef.current.lock();
		}
	}, [deviceMode, openDeathScreen, disableControls]);

	useEffect(() => {
		const handleCanvasClick = (e) => {
			if (useGame.getState().isEndScreen) {
				e.stopPropagation();
				if (controlsRef.current) {
					controlsRef.current.unlock();
				}
			}
		};

		const canvas = document.querySelector('canvas');
		if (canvas) {
			canvas.addEventListener('click', handleCanvasClick);
		}

		return () => {
			if (canvas) {
				canvas.removeEventListener('click', handleCanvasClick);
			}
		};
	}, []);

	useEffect(() => {
		if (disableControls && controlsRef.current) {
			controlsRef.current.unlock();
		}
	}, [disableControls]);

	useEffect(() => {
		if (introIsPlaying) {
			hasIntroBeenPlayedRef.current = true;
		}
	}, [introIsPlaying]);

	useEffect(() => {
		if (!introIsPlaying && !hasIntroBeenPlayedRef.current) {
			camera.rotation.set(0, Math.PI, 0);
		}
	}, [camera, introIsPlaying]);

	useEffect(() => {
		if (openDeathScreen && controlsRef.current) {
			controlsRef.current.unlock();
		}
	}, [openDeathScreen]);

	useEffect(() => {
		const initialTimer = setTimeout(
			() => {
				frameCount.current = 0;
				lastTime.current = performance.now();
			},
			isMobile ? 5000 : 2000
		);

		return () => clearTimeout(initialTimer);
	}, [isMobile]);

	useFrame(() => {
		if (!lastTime.current) return;

		const currentTime = performance.now();
		const deltaTime = currentTime - lastTime.current;

		const targetDelta = isMobile ? 50 : 33; // ~20 FPS on mobile, ~30 FPS on desktop
		const requiredFrames = isMobile ? 30 : 60; // Less frames required on mobile

		if (deltaTime < targetDelta) {
			frameCount.current++;
		} else {
			frameCount.current = Math.max(0, frameCount.current - 2);
		}

		if (frameCount.current > requiredFrames && !isStable) {
			setIsStable(true);
		}

		lastTime.current = currentTime;
	});

	const timeoutSet = useRef(false);

	useFrame(({ camera }) => {
		if (
			camera.position.x > 8 &&
			camera.position.z < -4 &&
			!timeoutSet.current
		) {
			timeoutSet.current = true;
			setEnd(true);
			if (controlsRef.current) {
				controlsRef.current.unlock();
			}

			if (deviceMode === 'keyboard' && isPointerLocked()) {
				exitPointerLock();
			}

			setTimeout(() => {
				regenerateData();
				resetGame();
				if (controlsRef.current) {
					controlsRef.current.unlock();
				}
				timeoutSet.current = false;
			}, 1000);
		}

		const x = camera.position.x;
		const z = camera.position.z;
		const isTopSide = z > 0;

		const baseRoomIndex = Math.floor((x - 8) / CORRIDORLENGTH);
		const roomIndex = isTopSide
			? Math.abs(baseRoomIndex) - 2
			: Math.abs(baseRoomIndex) + roomCount / 2 - 2;

		if (roomIndex >= 0 && roomIndex < roomCount) {
			if (realPlayerPositionRoom !== roomIndex) {
				setRealPlayerPositionRoom(roomIndex);
			}
		} else {
			if (realPlayerPositionRoom && realPlayerPositionRoom !== 0) {
				setRealPlayerPositionRoom(null);
			}
		}
	});

	useControls(
		'Gameplay Settings',
		{
			'Room Count': {
				value: roomCount,
				min: 4,
				max: 40,
				step: 2,
				onChange: (value) => setRoomCount(value),
			},
			'Empty Room %': {
				value: emptyRoomPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setEmptyRoomPercentage(value),
			},
			'Random Room %': {
				value: randomRoomPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setRandomRoomPercentage(value),
			},
			'Raid %': {
				value: raidPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setRaidPercentage(value),
			},
			'Hideout %': {
				value: hideoutPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setHideoutPercentage(value),
			},
			'Landmine %': {
				value: landminePercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setLandminePercentage(value),
			},
			'Claymore %': {
				value: claymorePercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setClaymorePercentage(value),
			},
			'Hunter %': {
				value: hunterPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setHunterPercentage(value),
			},
			'Sonar %': {
				value: sonarPercentage,
				min: 0,
				max: 100,
				step: 5,
				onChange: (value) => setSonarPercentage(value),
			},
		},
		{
			collapsed: true,
		}
	);

	useEffect(() => {
		initializeIfNeeded();
	}, [
		initializeIfNeeded,
		roomCount,
		emptyRoomPercentage,
		hideoutPercentage,
		landminePercentage,
		claymorePercentage,
		hunterPercentage,
		sonarPercentage,
		raidPercentage,
	]);

	const shouldRenderThreeJs = useGame((state) => state.shouldRenderThreeJs);

	return (
		<>
			<ListeningMode />
			<KeyboardControls
				map={[
					{ name: 'forward', keys: ['ArrowUp', 'KeyW', 'KeyZ', 'gamepad1'] },
					{ name: 'backward', keys: ['ArrowDown', 'KeyS', 'gamepad2'] },
					{ name: 'left', keys: ['ArrowLeft', 'KeyA', 'KeyQ', 'gamepad3'] },
					{ name: 'right', keys: ['ArrowRight', 'KeyD', 'gamepad4'] },
					{ name: 'jump', keys: ['Space', 'gamepad0'] },
					{ name: 'run', keys: ['ShiftLeft', 'ShiftRight', 'gamepad10'] },
					{
						name: 'crouch',
						keys: ['ControlLeft', 'ControlRight', 'MetaLeft', 'gamepad11'],
					},
					{ name: 'action', keys: ['KeyE', 'gamepad5'] },
				]}
			>
				{deviceMode !== 'gamepad' && !isMobile && !disableControls && (
					<CustomPointerLockControls ref={controlsRef} />
				)}

				<Player />
				<Triggers />
				<Grid />
				<Sound />
				<Tutorial />
				<EndGameAnimation />

				{shouldRenderThreeJs && (
					<>
						{duplicateComponents(RoomDoor)}
						<group position={position}>
							<CorridorStart position={[1.07, 0, 0]} />
							<CorridorMiddles />
							<CorridorEnd
								position={[-1.19 - (roomCount / 2 - 1) * CORRIDORLENGTH, 0, 0]}
							/>
						</group>

						<Room />
						<Monster />

						<ReceptionDoors />
						<Reception />

						<BathroomDoor />
						<NightstandDoor />
						<DeskDoor />
						<RoomCurtain />
						<BathroomCurtain key="bathroom1" name="bathroom1" />
						<BathroomCurtain
							key="bathroom2"
							name="bathroom2"
							positionOffset={2}
						/>
						<Bedsheets />
						<Window />
						<Bottles />
					</>
				)}
			</KeyboardControls>
		</>
	);
}

export default function AppCanvas() {
	const performanceMode = useGame((state) => state.performanceMode);
	const isMobile = useGame((state) => state.isMobile);
	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const shadows = useSettings((state) => state.shadows);
	const setShadows = useSettings((state) => state.setShadows);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const playAnimation = useMonster((state) => state.playAnimation);

	useEffect(() => {
		if (isElectron()) {
			setShadows(true);
		} else {
			setShadows(performanceMode && !isMobile);
		}
	}, [performanceMode, isMobile, setShadows]);

	const triggerMonsterAttack = useCallback(() => {
		setMonsterState('run');
		playAnimation('Run');
	}, [setMonsterState, playAnimation]);

	const { perfVisible } = useControls(
		{
			perfVisible: { value: false, label: 'Show performances' },
			'Reset game': button(() => {
				regenerateData();
				resetGame();
			}),
			'Play Intro Animation': button(() => {
				setPlayIntro(true);
			}),
			'Complete All Objectives': button(() => {
				useInterface.getState().setAllObjectivesCompleted();
			}),
			Die: button(() => {
				triggerMonsterAttack();
			}),
		},
		{
			collapsed: true,
		}
	);

	const isDebugMode = window.location.hash.includes('#debug');

	return (
		<>
			<div onClick={(e) => e.stopPropagation()}>
				<Leva collapsed hidden={!isDebugMode} />
			</div>
			<Suspense fallback={null}>
				<Canvas
					camera={{
						fov: 75,
						near: 0.1,
						far: 30,
					}}
					gl={{
						powerPreference: 'high-performance',
						antialias: false,
						depth: false,
						stencil: false,
					}}
					dpr={[1, 1.5]}
					performance={{ min: 0.5 }}
					shadows={shadows}
				>
					{perfVisible ? <Perf position="top-left" /> : null}
					<ShadowManager />
					<App />
					<PostProcessing />
				</Canvas>
			</Suspense>
			<Interface />
		</>
	);
}
