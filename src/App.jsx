import { useEffect, Suspense, useMemo, useRef } from 'react';
import {
	KeyboardControls,
	PointerLockControls,
	Stats,
} from '@react-three/drei';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
	EffectComposer,
	ChromaticAberration,
	Vignette,
	Noise,
	Glitch,
} from '@react-three/postprocessing';
import Interface from './components/Interface/Interface';
import './style.css';
import useGame from './hooks/useGame';
import useInterface from './hooks/useInterface';
import useDoor from './hooks/useDoor';
import useMonster from './hooks/useMonster';
import useGridStore from './hooks/useGrid';

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
import Triggers from './components/Monster/Triggers';
import Grid from './components/Grid';
import ReceptionDoors from './components/Reception/ReceptionDoors';
// import CameraShaking from './components/Player/CameraShaking';
import Sound from './components/Sound';
import Chair from './components/Room/Chair';
import { regenerateData } from './utils/config';

// import Posterize from './components/Posterize';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
}

const CORRIDORLENGTH = 5.95;

function App() {
	const isMobile = useGame((state) => state.isMobile);
	const roomTotal = useGame((state) => state.roomTotal);
	// const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setRealPlayerPositionRoom = useGame(
		(state) => state.setRealPlayerPositionRoom
	);
	const setEnd = useGame((state) => state.setEnd);
	const deviceMode = useGame((state) => state.deviceMode);
	const { camera } = useThree();
	const setIsLocked = useGame((state) => state.setIsLocked);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const controlsRef = useRef();
	const timeoutSet = useRef(false);

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
		if (openDeathScreen) {
			controlsRef.current.unlock();
		}
	}, [openDeathScreen]);

	useFrame(({ camera }) => {
		if (isMobile) {
			if (
				camera.position.x > 3.8 &&
				camera.position.z > -1 &&
				!timeoutSet.current
			) {
				timeoutSet.current = true;
				setEnd(true);

				setTimeout(() => {
					regenerateData();
					resetGame();
					timeoutSet.current = false;
				}, 1000);
			}
		} else {
			if (
				camera.position.x > 8 &&
				camera.position.z < -4 &&
				!timeoutSet.current
			) {
				timeoutSet.current = true;
				setEnd(true);
				controlsRef.current.unlock();

				setTimeout(() => {
					regenerateData();
					resetGame();
					controlsRef.current.unlock();
					timeoutSet.current = false;
				}, 1000);
			}
		}

		const x = camera.position.x;
		const z = camera.position.z;
		const isTopSide = z > 0;

		const baseRoomIndex = Math.floor((x - 8) / CORRIDORLENGTH);
		const roomIndex = isTopSide
			? Math.abs(baseRoomIndex) - 2
			: Math.abs(baseRoomIndex) + roomTotal / 2 - 2;

		if (roomIndex >= 0 && roomIndex < roomTotal) {
			setRealPlayerPositionRoom(roomIndex);
		} else {
			setRealPlayerPositionRoom(null);
		}
	});

	const initializeIfNeeded = useGridStore((state) => state.initializeIfNeeded);

	useEffect(() => {
		initializeIfNeeded();
	}, [initializeIfNeeded]);

	return (
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
			<Player />
			<Monster />
			<Triggers />
			<Grid />
			<Sound />

			{deviceMode !== 'gamepad' && !isMobile && (
				<PointerLockControls ref={controlsRef} />
			)}

			{/* Reception */}
			<ReceptionDoors />
			{/* {!isMobile && ( */}
			<Reception rotation={[0, Math.PI / 2, 0]} position={[9.805, 0, -0.15]} />
			{/* )} */}

			{/* Corridor */}
			{duplicateComponents(RoomDoor)}

			<group position={position}>
				<CorridorStart position={[1.07, 0, 0]} />
				<CorridorMiddles />
				<CorridorEnd
					position={[-1.19 - (roomTotal / 2 - 1) * CORRIDORLENGTH, 0, 0]}
				/>
			</group>

			{/* Room */}
			<Suspense fallback={null}>
				<group>
					<Room />

					{/* Doors */}
					<BathroomDoor />
					<NightstandDoor />
					<DeskDoor />

					{/* Curtains */}
					<RoomCurtain />
					<BathroomCurtain key="bathroom1" positionOffset={2} />
					<BathroomCurtain key="bathroom2" />

					{/* Objectives */}
					<Bedsheets />
					<Window />
					<Bottles />

					<Chair />
				</group>
			</Suspense>
		</KeyboardControls>
	);
}

export default function AppCanvas() {
	const shakeIntensity = useGame((state) => state.shakeIntensity);
	const isMobile = useGame((state) => state.isMobile);

	return (
		<>
			<Suspense fallback={null}>
				<Canvas
					camera={{
						fov: 75,
						near: 0.1,
						far: 1000,
					}}
					shadows
				>
					<App />
					{!isMobile && (
						<EffectComposer
						// multisamping={8}
						// renderIndex={1}
						// disableGamma={false}
						// disableRenderPass={false}
						// disableRender={false}
						>
							{/* <Posterize levels={64} /> */}

							<ChromaticAberration offset={[0.001, 0.001]} />
							<Vignette
								eskil={false}
								offset={0.05}
								darkness={
									0
									// 1.2
								}
							/>
							<Noise opacity={0.1} />
							<Glitch
								active={shakeIntensity}
								strength={shakeIntensity * 0.05}
							/>
						</EffectComposer>
					)}
				</Canvas>
				<Stats />
			</Suspense>
			<Interface />
		</>
	);
}
