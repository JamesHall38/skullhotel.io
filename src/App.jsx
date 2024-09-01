import { useEffect, Suspense, useMemo } from 'react';
import { KeyboardControls, PointerLockControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
	EffectComposer,
	ChromaticAberration,
	Vignette,
	Noise,
	Glitch,
} from '@react-three/postprocessing';
import { Physics } from '@react-three/rapier';
import Interface from './components/Interface/Interface';
import './style.css';
import useGame from './hooks/useGame';

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
// Physics
import RoomPhysics from './components/Room/RoomPhysics';
import Ground from './components/Room/Ground';
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
import ReceptionPhysics from './components/Reception/ReceptionPhysics';
import ReceptionDoors from './components/Reception/ReceptionDoors';
import CameraShaking from './components/Player/CameraShaking';
import Events from './components/Monster/Events';
import Sound from './components/Sound';

const CORRIDORLENGTH = 5.95;

function App() {
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const { camera } = useThree();

	const duplicateComponents = (Component) => {
		return [...Array(roomTotal / 2)].map((_, i) => (
			<group key={i}>
				<Component roomNumber={i} />
				<Component roomNumber={i + roomTotal / 2} />
			</group>
		));
	};

	useEffect(() => {
		camera.rotation.set(0, Math.PI, 0);
	}, [camera]);

	const position = useMemo(() => {
		let calculatedPosition = [0, 0, 0];
		if (camera.position.x > 8 && Math.round(camera.position.z) === 3) {
			calculatedPosition = [24.5, 0, 14.5];
		}
		return calculatedPosition;
	}, [camera.position]);

	return (
		<KeyboardControls
			map={[
				{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
				{ name: 'backward', keys: ['ArrowDown', 'KeyS'] },
				{ name: 'left', keys: ['ArrowLeft', 'KeyA'] },
				{ name: 'right', keys: ['ArrowRight', 'KeyD'] },
				{ name: 'jump', keys: ['Space'] },
				{ name: 'action', keys: ['KeyE'] },
			]}
		>
			{playerPositionRoom !== null && <CameraShaking />}
			<PointerLockControls />

			<Sound />
			<Monster />
			<Triggers />
			<Events />

			{/* Models */}
			<Reception rotation={[0, Math.PI / 2, 0]} position={[9.805, 0, -0.15]} />
			<Room roomNumber={0} />
			<group position={position}>
				<CorridorStart position={[1.07, 0, 0]} />
				<CorridorMiddles />
				<CorridorEnd
					position={[-1.19 - (roomTotal / 2 - 1) * CORRIDORLENGTH, 0, 0]}
				/>
			</group>

			{/* Curtains */}
			<RoomCurtain />
			<BathroomCurtain key="bathroom1" positionOffset={-2} />
			<BathroomCurtain key="bathroom2" />

			{/* Objectives */}
			<Bedsheets />
			<Window />
			<Bottles />

			<Physics gravity={[0, -30, 0]}>
				<Player />
				<Ground />
				<ReceptionPhysics />
				<ReceptionDoors />
				<RoomPhysics />
				{duplicateComponents(RoomDoor)}
				<BathroomDoor />
				<NightstandDoor />
				<DeskDoor />
			</Physics>
		</KeyboardControls>
	);
}

export default function AppCanvas() {
	const shakeIntensity = useGame((state) => state.shakeIntensity);
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
					<EffectComposer>
						<ChromaticAberration offset={[0.001, 0.001]} />
						<Vignette eskil={false} offset={0.05} darkness={1.2} />
						<Noise opacity={0.1} />
						<Glitch active={shakeIntensity} strength={shakeIntensity * 0.05} />
					</EffectComposer>
				</Canvas>
			</Suspense>
			<Interface />
		</>
	);
}
