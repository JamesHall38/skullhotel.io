<<<<<<< Updated upstream
import { useRef, useState } from 'react';
=======
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
>>>>>>> Stashed changes
import * as THREE from 'three';
import Flashlight from './Flashlight';
import Crouch from './Crouch';
import Movement from './Movement';
import Jump from './Jump';
import Rotation from './Rotation';
import FootSteps from './FootSteps';

export default function Player() {
<<<<<<< Updated upstream
	const [isRunning, setIsRunning] = useState(false);
	const [isCrouching, setIsCrouching] = useState(false);
=======
	const isRunning = useGameStore((state) => state.isRunning);
	const setIsRunning = useGameStore((state) => state.setIsRunning);

>>>>>>> Stashed changes
	const playerPosition = useRef(new THREE.Vector3());
	const playerVelocity = useRef(new THREE.Vector3());

	return (
		<>
			<Movement
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouching={isCrouching}
				isRunning={isRunning}
			/>
			<Jump
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouching={isCrouching}
			/>
			<Rotation
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				setIsRunning={setIsRunning}
			/>
			<FootSteps playerPosition={playerPosition} />
			<Flashlight playerRef={playerPosition} isCrouching={isCrouching} />
			<Crouch setIsCrouching={setIsCrouching} playerPosition={playerPosition} />
		</>
	);
}
