import { useEffect, Suspense, useMemo, useRef, useState } from 'react';
import { KeyboardControls, PointerLockControls } from '@react-three/drei';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import Interface from './components/Interface/Interface';
import './style.css';
import useGame from './hooks/useGame';
import useInterface from './hooks/useInterface';
import useDoor from './hooks/useDoor';
import useMonster from './hooks/useMonster';
import useGridStore from './hooks/useGrid';
import useLight from './hooks/useLight';
// import useProgressiveLoad from './hooks/useProgressiveLoad';
import PostProcessing from './components/PostProcessing/PostProcessing';

import { Perf } from 'r3f-perf';
import { Leva, useControls, button } from 'leva';

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
// import Chair from './components/Room/Chair';
import { regenerateData } from './utils/config';
import generateSeedData from './utils/generateSeedData';
import ListeningMode from './components/ListeningMode';

// import Posterize from './components/Posterize';

import levelData from './components/Monster/Triggers/levelData';
import { preloadSounds } from './utils/audio';

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
	const roomTotal = useGame((state) => state.roomTotal);
	const deviceMode = useGame((state) => state.deviceMode);
	const setSeedData = useGame((state) => state.setSeedData);
	const setIsLocked = useGame((state) => state.setIsLocked);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
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

	const duplicateComponents = (Component) => {
		return [...Array(roomTotal / 2)].map((_, i) => (
			<group key={i}>
				<Component roomNumber={i} />
				<Component roomNumber={i + roomTotal / 2} />
			</group>
		));
	};

	const position = useMemo(() => {
		let calculatedPosition = [0, 0, 0];
		if (camera.position.x > 8 && Math.round(camera.position.z) === 3) {
			calculatedPosition = [24.5, 0, 14.5];
		}
		return calculatedPosition;
	}, [camera.position]);

	const { selectedRoom } = useControls({
		selectedRoom: {
			options: generateLevelOptions(),
			value: null,
			label: 'Select Room',
		},
	});

	useEffect(() => {
		let newSeedData;
		if (selectedRoom) {
			newSeedData = {
				[selectedRoom]: {
					...levelData[selectedRoom],
					type: selectedRoom,
				},
				empty_1: {
					type: 'empty',
					number: 1,
					hideObjective: 'window',
					hideSpot: 'roomCurtain',
				},
				empty_2: {
					type: 'empty',
					number: 2,
					hideObjective: 'bedsheets',
					hideSpot: 'desk',
				},
				empty_3: {
					type: 'empty',
					number: 3,
					hideObjective: 'bottles',
					hideSpot: 'bathroomCurtain',
				},
			};
		} else {
			newSeedData = generateSeedData(false, selectedRoom);
		}
		setSeedData(newSeedData);
		initializeIfNeeded();
	}, [initializeIfNeeded, selectedRoom, setSeedData]);

	useEffect(() => {
		const controls = controlsRef.current;

		const handleLock = () => setIsLocked(true);
		const handleUnlock = () => setIsLocked(false);

		if (controls) {
			controls.addEventListener('lock', handleLock);
			controls.addEventListener('unlock', handleUnlock);

			return () => {
				controls.removeEventListener('lock', handleLock);
				controls.removeEventListener('unlock', handleUnlock);
			};
		}
	}, [setIsLocked]);

	useEffect(() => {
		camera.rotation.set(0, Math.PI, 0);
	}, [camera]);

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
			frameCount.current = Math.max(0, frameCount.current - 2); // Régression plus douce
		}

		if (frameCount.current > requiredFrames && !isStable) {
			setIsStable(true);
		}

		lastTime.current = currentTime;
	});

	useEffect(() => {
		const handleFirstInteraction = () => {
			const audioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			if (audioContext.state === 'suspended') {
				audioContext.resume();
			}
			preloadSounds();
			document.removeEventListener('click', handleFirstInteraction);
		};

		document.addEventListener('click', handleFirstInteraction);
		return () => {
			document.removeEventListener('click', handleFirstInteraction);
		};
	}, []);

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

			setTimeout(() => {
				regenerateData();
				resetGame();
				if (controlsRef.current) {
					controlsRef.current.unlock();
				}
				timeoutSet.current = false;
			}, 1000);
		}
		// }

		const x = camera.position.x;
		const z = camera.position.z;
		const isTopSide = z > 0;

		const baseRoomIndex = Math.floor((x - 8) / CORRIDORLENGTH);
		const roomIndex = isTopSide
			? Math.abs(baseRoomIndex) - 2
			: Math.abs(baseRoomIndex) + roomTotal / 2 - 2;

		if (roomIndex >= 0 && roomIndex < roomTotal) {
			if (realPlayerPositionRoom !== roomIndex) {
				setRealPlayerPositionRoom(roomIndex);
			}
		} else {
			if (realPlayerPositionRoom && realPlayerPositionRoom !== 0) {
				setRealPlayerPositionRoom(null);
			}
		}
	});

	return (
		<>
			<ListeningMode />
			<KeyboardControls
				map={[
					{ name: 'forward', keys: ['ArrowUp', 'KeyW', 'gamepad1'] },
					{ name: 'backward', keys: ['ArrowDown', 'KeyS', 'gamepad2'] },
					{ name: 'left', keys: ['ArrowLeft', 'KeyA', 'gamepad3'] },
					{ name: 'right', keys: ['ArrowRight', 'KeyD', 'gamepad4'] },
					{ name: 'jump', keys: ['Space', 'gamepad0'] },
					{ name: 'run', keys: ['ShiftLeft', 'gamepad10'] },
					{ name: 'crouch', keys: ['ControlLeft', 'gamepad11'] },
					{ name: 'action', keys: ['KeyE', 'gamepad5'] },
				]}
			>
				{deviceMode !== 'gamepad' && !isMobile && (
					<PointerLockControls ref={controlsRef} />
				)}

				<Player />
				<Triggers />
				<Grid />
				<Sound />
				<ReceptionDoors />
				<Reception
					rotation={[0, Math.PI / 2, 0]}
					position={[9.805, 0, -0.15]}
				/>
				<Tutorial />
				{duplicateComponents(RoomDoor)}
				<group position={position}>
					<CorridorStart position={[1.07, 0, 0]} />
					<CorridorMiddles />
					<CorridorEnd
						position={[-1.19 - (roomTotal / 2 - 1) * CORRIDORLENGTH, 0, 0]}
					/>
				</group>

				<Room />
				<Monster />

				<BathroomDoor />
				<NightstandDoor />
				<DeskDoor />
				<RoomCurtain />
				<BathroomCurtain key="bathroom1" />
				<BathroomCurtain key="bathroom2" positionOffset={2} />
				<Bedsheets />
				<Window />
				<Bottles />
				{/* <Chair /> */}
			</KeyboardControls>
		</>
	);
}

export default function AppCanvas() {
	const performanceMode = useGame((state) => state.performanceMode);
	const isMobile = useGame((state) => state.isMobile);

	const { perfVisible } = useControls({
		perfVisible: { value: false, label: 'Show performances' },
		'Reset game': button(() => {
			regenerateData();
			resetGame();
		}),
	});

	const isDebugMode = window.location.hash === '#debug';

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
						powerPreference: 'default',
						antialias: false,
						depth: false,
						stencil: false,
					}}
					dpr={[1, 1.5]}
					performance={{ min: 0.5 }}
					// shadows={performanceMode && !isMobile}
					shadows={true}
				>
					{perfVisible ? <Perf position="top-left" /> : null}
					<App />
					<PostProcessing />
				</Canvas>
			</Suspense>
			<Interface />
		</>
	);
}
