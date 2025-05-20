import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import useJoysticksStore from '../../hooks/useJoysticks';
import useGamepadControls from '../../hooks/useGamepadControls';
import useEndGameAnimation from '../../hooks/useEndGameAnimation';

const floor = -0.2;
const STEP_INTERVAL = {
	walk: 800,
	run: 400,
};

const VOLUMES = {
	walk: 0.25,
	run: 0.4,
	landing: 0.5,
};

const RUN_SPEED = 1;

const MOVEMENT_THRESHOLD = 0.00001;

export default function FootSteps({
	playerPosition,
	playerVelocity,
	isCrouchingRef,
}) {
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
	const isMobile = useGame((state) => state.isMobile);
	const getKeys = useKeyboardControls()[1];
	const getGamepadControls = useGamepadControls();
	const isCameraLocked = useGame((state) => state.isCameraLocked);
	const jumpScare = useGame((state) => state.jumpScare);
	const isAnyPopupOpen = useGame((state) => state.isAnyPopupOpen);
	const isPlaying = useEndGameAnimation((state) => state.isPlaying);
	const leftStickRef = useJoysticksStore((state) => state.leftStickRef);

	const lastPosition = useRef(new THREE.Vector3());
	const footstepIndexRef = useRef(0);
	const lastStepTime = useRef(0);
	const wasMovingRef = useRef(false);

	useFrame((state) => {
		if (
			!soundsReady ||
			isPlaying ||
			isCameraLocked ||
			jumpScare ||
			isAnyPopupOpen ||
			isCrouchingRef.current
		) {
			return;
		}

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

			const speed = playerVelocity ? playerVelocity.current.length() : 0;
			const isPlayerRunning = speed > RUN_SPEED * 0.9;

			if (isMoving && !wasMovingRef.current) {
				const sound = footstepRefs.current[footstepIndexRef.current];
				if (sound && currentTime - lastStepTime.current > STEP_INTERVAL.run) {
					sound.volume = isPlayerRunning ? VOLUMES.run : VOLUMES.walk;
					sound.currentTime = 0;
					if (!resetFootstepSound) {
						sound.play().catch(() => {});
					} else {
						setResetFootstepSound(false);
					}
					footstepIndexRef.current =
						(footstepIndexRef.current + 1) % footstepRefs.current.length;
					lastStepTime.current = currentTime;
				}
			} else if (isMoving) {
				const interval = isPlayerRunning
					? STEP_INTERVAL.run
					: STEP_INTERVAL.walk;
				if (currentTime - lastStepTime.current > interval) {
					const sound = footstepRefs.current[footstepIndexRef.current];
					if (sound) {
						sound.volume = isPlayerRunning ? VOLUMES.run : VOLUMES.walk;
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
	});

	return null;
}
