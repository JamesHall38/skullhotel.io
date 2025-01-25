import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { getSoundUrl } from '../../utils/audio';

const floor = -0.2;
const STEP_INTERVAL = {
	walk: 600,
	run: 350,
};

const VOLUMES = {
	walk: 0.25,
	run: 0.4,
	landing: 0.5,
};

const JUMP_SOUND_DELAY = 400;
const MOVEMENT_THRESHOLD = 0.00001;

export default function FootSteps({ playerPosition }) {
	const footstepSounds = useMemo(
		() => [
			new Audio(getSoundUrl('step1')),
			new Audio(getSoundUrl('step2')),
			new Audio(getSoundUrl('step3')),
			new Audio(getSoundUrl('step4')),
			new Audio(getSoundUrl('step5')),
			new Audio(getSoundUrl('step6')),
			new Audio(getSoundUrl('step7')),
			new Audio(getSoundUrl('step8')),
			new Audio(getSoundUrl('step9')),
		],
		[]
	);

	// const loading = useGame((state) => state.loading);
	const resetFootstepSound = useGame((state) => state.resetFootstepSound);
	const setResetFootstepSound = useGame((state) => state.setResetFootstepSound);
	const isRunning = useGame((state) => state.isRunning);
	const getKeys = useKeyboardControls()[1];
	const isListening = useGame((state) => state.isListening);

	const lastPosition = useRef(new THREE.Vector3());
	const footstepRefs = useRef(footstepSounds);
	const footstepIndexRef = useRef(0);
	const lastStepTime = useRef(0);
	const wasMovingRef = useRef(false);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'Space') {
				setTimeout(() => {
					const soundIndex = Math.floor(
						Math.random() * footstepRefs.current.length
					);
					const sound = footstepRefs.current[soundIndex];
					if (sound) {
						sound.volume = VOLUMES.landing;
						sound.currentTime = 0;
						sound.play().catch(() => {});
					}
				}, JUMP_SOUND_DELAY);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	useFrame((state) => {
		if (
			// !loading &&
			!isListening
		) {
			if (playerPosition.current.y <= floor) {
				const currentTime = state.clock.getElapsedTime() * 1000;
				const { forward, backward, left, right } = getKeys();
				const keysPressed = forward || backward || left || right;

				const currentPosition = playerPosition.current;
				const movement = new THREE.Vector3().subVectors(
					currentPosition,
					lastPosition.current
				);
				const actuallyMoving = movement.lengthSq() > MOVEMENT_THRESHOLD;

				lastPosition.current.copy(currentPosition);

				const isMoving = keysPressed && actuallyMoving;

				if (isMoving && !wasMovingRef.current) {
					const sound = footstepRefs.current[footstepIndexRef.current];
					if (sound) {
						sound.volume = isRunning ? VOLUMES.run : VOLUMES.walk;
						sound.currentTime = 0;
						if (!resetFootstepSound) {
							sound.play().catch(() => {});
						} else {
							setResetFootstepSound(false);
						}
					}

					footstepIndexRef.current =
						(footstepIndexRef.current + 1) % footstepRefs.current.length;
					lastStepTime.current = currentTime;
				} else if (isMoving) {
					const interval = isRunning ? STEP_INTERVAL.run : STEP_INTERVAL.walk;
					if (currentTime - lastStepTime.current > interval) {
						const sound = footstepRefs.current[footstepIndexRef.current];
						if (sound) {
							sound.volume = isRunning ? VOLUMES.run : VOLUMES.walk;
							sound.currentTime = 0;
							if (!resetFootstepSound) {
								sound.play().catch(() => {});
							} else {
								setResetFootstepSound(false);
							}
						}

						footstepIndexRef.current =
							(footstepIndexRef.current + 1) % footstepRefs.current.length;
						lastStepTime.current = currentTime;
					}
				}

				wasMovingRef.current = isMoving;
			}
		}
	});

	return null;
}
