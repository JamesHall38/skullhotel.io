import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Flashlight from './Flashlight';
import Crouch from './Crouch';
import Movement from './Movement';
import Jump from './Jump';
import Rotation from './Rotation';
import FootSteps from './FootSteps';
import useHiding from '../../hooks/useHiding';
import useGameStore from '../../hooks/useGame';

export default function Player() {
	const isRunning = useGameStore((state) => state.isRunning);
	const setIsRunning = useGameStore((state) => state.setIsRunning);
	const disableControls = useGameStore((state) => state.disableControls);
	const playerPositionRoom = useGameStore((state) => state.playerPositionRoom);
	const seedData = useGameStore((state) => state.seedData);

	const playerPosition = useRef(new THREE.Vector3());
	const playerVelocity = useRef(new THREE.Vector3());
	const isCrouchingRef = useRef(false);
	const crouchProgressRef = useRef(0);

	const checkIfPlayerIsHidden = useHiding(
		(state) => state.checkIfPlayerIsHidden
	);
	const playerHidden = useHiding((state) => state.isPlayerHidden);
	const setPlayerHidden = useHiding((state) => state.setPlayerHidden);
	const checkUnnecessaryFear = useHiding((state) => state.checkUnnecessaryFear);

	useFrame(({ camera }) => {
		if (
			Math.floor(performance.now() / 100) !==
			Math.floor((performance.now() - 16.67) / 100)
		) {
			const isHidden = checkIfPlayerIsHidden(camera);
			if (isHidden !== playerHidden) {
				setPlayerHidden(isHidden);
			}

			checkUnnecessaryFear(playerPositionRoom, seedData);
		}
	});

	return (
		<>
			<Jump
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouchingRef={isCrouchingRef}
				crouchProgressRef={crouchProgressRef}
			/>
			<Crouch
				isCrouchingRef={isCrouchingRef}
				crouchProgressRef={crouchProgressRef}
				playerPosition={playerPosition}
			/>
			<Flashlight
				playerRef={playerPosition}
				crouchProgressRef={crouchProgressRef}
			/>
			<Movement
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouchingRef={isCrouchingRef}
				isRunning={isRunning}
				crouchProgressRef={crouchProgressRef}
			/>
			<Rotation
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				setIsRunning={setIsRunning}
				disableControls={disableControls}
				isCrouchingRef={isCrouchingRef}
			/>
			<FootSteps
				playerPosition={playerPosition}
				playerVelocity={playerVelocity}
				isCrouchingRef={isCrouchingRef}
			/>
		</>
	);
}
