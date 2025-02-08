import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import useJoysticksStore from '../../hooks/useJoysticks';
import useGamepadControls from '../../hooks/useGamepadControls';

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
	const [soundsReady, setSoundsReady] = useState(false);
	const footstepRefs = useRef(null);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				footstepRefs.current = [
					getAudioInstance('step1'),
					getAudioInstance('step2'),
					getAudioInstance('step3'),
					getAudioInstance('step4'),
					getAudioInstance('step5'),
					getAudioInstance('step6'),
					getAudioInstance('step7'),
					getAudioInstance('step8'),
					getAudioInstance('step9'),
				];
				if (footstepRefs.current.every((sound) => sound)) {
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (footstepRefs.current) {
				footstepRefs.current.forEach((sound) => {
					if (sound) {
						sound.pause();
						sound.currentTime = 0;
					}
				});
			}
		};
	}, []);

	const resetFootstepSound = useGame((state) => state.resetFootstepSound);
	const setResetFootstepSound = useGame((state) => state.setResetFootstepSound);
	const isRunning = useGame((state) => state.isRunning);
	const isMobile = useGame((state) => state.isMobile);
	const getKeys = useKeyboardControls()[1];
	const getGamepadControls = useGamepadControls();
	const isListening = useGame((state) => state.isListening);
	const leftStickRef = useJoysticksStore((state) => state.leftStickRef);
	const controls = useJoysticksStore((state) => state.controls);

	const lastPosition = useRef(new THREE.Vector3());
	const footstepIndexRef = useRef(0);
	const lastStepTime = useRef(0);
	const wasMovingRef = useRef(false);

	useEffect(() => {
		if (!soundsReady) return;

		const handleJumpSound = () => {
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
		};

		const handleKeyDown = (event) => {
			if (event.code === 'Space') {
				handleJumpSound();
			}
		};

		if (!isMobile) {
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [isMobile, soundsReady]);

	useEffect(() => {
		if (!soundsReady) return;

		if (isMobile && controls.jump) {
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
	}, [controls.jump, isMobile, soundsReady]);

	useFrame((state) => {
		if (!soundsReady || !isListening) {
			if (playerPosition.current.y <= floor) {
				const currentTime = state.clock.getElapsedTime() * 1000;

				// Keyboard's controls
				const {
					forward: keyForward,
					backward: keyBackward,
					left: keyLeft,
					right: keyRight,
				} = getKeys();
				const gamepadControls = getGamepadControls();

				let forward = keyForward || gamepadControls.forward;
				let backward = keyBackward || gamepadControls.backward;
				let left = keyLeft || gamepadControls.left;
				let right = keyRight || gamepadControls.right;

				// Mobile joystick's controls
				if (isMobile && leftStickRef.current) {
					if (Math.abs(leftStickRef.current.y) > 0.1) {
						forward = leftStickRef.current.y < 0;
						backward = leftStickRef.current.y > 0;
					}
					if (Math.abs(leftStickRef.current.x) > 0.1) {
						left = leftStickRef.current.x < 0;
						right = leftStickRef.current.x > 0;
					}
				}

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
