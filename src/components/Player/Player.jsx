import { useRef, useState } from 'react';
import * as THREE from 'three';
import Flashlight from './Flashlight';
import Crouch from './Crouch';
import Movement from './Movement';
import Jump from './Jump';
import Rotation from './Rotation';
import FootSteps from './FootSteps';

export default function Player() {
	const [isRunning, setIsRunning] = useState(false);
	const playerPosition = useRef(new THREE.Vector3());
	const playerVelocity = useRef(new THREE.Vector3());
	const isCrouchingRef = useRef(false);
	const crouchProgressRef = useRef(0);

	return (
		<>
			<Movement
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouchingRef={isCrouchingRef}
				isRunning={isRunning}
				crouchProgressRef={crouchProgressRef}
			/>
			<Jump
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouchingRef={isCrouchingRef}
				crouchProgressRef={crouchProgressRef}
			/>
			<Rotation
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				setIsRunning={setIsRunning}
			/>
			<FootSteps playerPosition={playerPosition} />
			<Flashlight
				playerRef={playerPosition}
				isCrouchingRef={isCrouchingRef}
				crouchProgressRef={crouchProgressRef}
			/>
			<Crouch
				isCrouchingRef={isCrouchingRef}
				crouchProgressRef={crouchProgressRef}
				playerPosition={playerPosition}
			/>
		</>
	);
}
