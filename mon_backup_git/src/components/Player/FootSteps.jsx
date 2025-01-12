import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const floor = -0.2;
const STEP_INTERVAL = {
	walk: 600, // ms between steps when walking
	run: 350, // ms between steps when running
};

const VOLUMES = {
	walk: 0.25,
	run: 0.4,
	landing: 0.5,
};

const JUMP_SOUND_DELAY = 400;
const MOVEMENT_THRESHOLD = 0.00001;

export default function FootSteps({ playerPosition }) {
	const loading = useGame((state) => state.loading);
	const resetFootstepSound = useGame((state) => state.resetFootstepSound);
	const setResetFootstepSound = useGame((state) => state.setResetFootstepSound);
	const isRunning = useGame((state) => state.isRunning);
	const getKeys = useKeyboardControls()[1];
	const isListening = useGame((state) => state.isListening);

	const lastPosition = useRef(new THREE.Vector3());
	const footstepSounds = useRef([
		new Audio('/sounds/step1.ogg'),
		new Audio('/sounds/step2.ogg'),
		new Audio('/sounds/step3.ogg'),
		new Audio('/sounds/step4.ogg'),
		new Audio('/sounds/step5.ogg'),
		new Audio('/sounds/step6.ogg'),
		new Audio('/sounds/step7.ogg'),
		new Audio('/sounds/step8.ogg'),
		new Audio('/sounds/step9.ogg'),
	]);

	const footstepIndexRef = useRef(0);
	const lastStepTime = useRef(0);
	const wasMovingRef = useRef(false);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'Space') {
				setTimeout(() => {
					const jumpSound =
						footstepSounds.current[
							Math.floor(Math.random() * footstepSounds.current.length)
						];
					jumpSound.volume = VOLUMES.landing;
					jumpSound.currentTime = 0;
					jumpSound.play();
				}, JUMP_SOUND_DELAY);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [playerPosition]);

	useFrame((state) => {
		if (!loading && !isListening) {
			if (playerPosition.current.y <= floor) {
				const currentTime = state.clock.getElapsedTime() * 1000;
				const { forward, backward, left, right } = getKeys();
				const keysPressed = forward || backward || left || right;

				// Calculer le déplacement réel
				const currentPosition = playerPosition.current;
				const movement = new THREE.Vector3().subVectors(
					currentPosition,
					lastPosition.current
				);
				const actuallyMoving = movement.lengthSq() > MOVEMENT_THRESHOLD;

				lastPosition.current.copy(currentPosition);

				const isMoving = keysPressed && actuallyMoving;

				if (isMoving && !wasMovingRef.current) {
					const sound = footstepSounds.current[footstepIndexRef.current];
					sound.volume = isRunning ? VOLUMES.run : VOLUMES.walk;
					sound.currentTime = 0;

					if (!resetFootstepSound) {
						sound.play();
					} else {
						setResetFootstepSound(false);
					}

					footstepIndexRef.current =
						(footstepIndexRef.current + 1) % footstepSounds.current.length;
					lastStepTime.current = currentTime;
				} else if (isMoving) {
					const interval = isRunning ? STEP_INTERVAL.run : STEP_INTERVAL.walk;
					if (currentTime - lastStepTime.current > interval) {
						const sound = footstepSounds.current[footstepIndexRef.current];
						sound.volume = isRunning ? VOLUMES.run : VOLUMES.walk;
						sound.currentTime = 0;

						if (!resetFootstepSound) {
							sound.play();
						} else {
							setResetFootstepSound(false);
						}

						footstepIndexRef.current =
							(footstepIndexRef.current + 1) % footstepSounds.current.length;
						lastStepTime.current = currentTime;
					}
				}

				wasMovingRef.current = isMoving;
			}
		}
	});
}
