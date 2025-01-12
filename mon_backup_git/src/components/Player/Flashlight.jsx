import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import { useFrame, useThree } from '@react-three/fiber';

<<<<<<< Updated upstream
const FLICKER_DURATION = 10000; // 10 seconds
const DEFAULT_INTENSITY = 6;

export default function Flashlight({ playerRef, isCrouching }) {
	const isFlickering = useGame((state) => state.isFlickering);
=======
// const FLICKER_DURATION = 10000;
const LERP_FACTOR = 0.05;
const DEFAULT_INTENSITY = 8;
const SIZE = 0.85;
const RING_OPACITY = 0.03;

export default function Flashlight({
	playerRef,
	// isCrouchingRef,
	crouchProgressRef,
}) {
	// const isFlickering = useGame((state) => state.isFlickering);
	const performanceMode = useGame((state) => state.performanceMode);
>>>>>>> Stashed changes
	const monsterState = useMonster((state) => state.monsterState);
	const spotLightRef = useRef();
	const { scene, camera } = useThree();
	const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);

	useEffect(() => {
		spotLightRef.current.angle = Math.PI / 6;
		spotLightRef.current.penumbra = 0.7;
		spotLightRef.current.distance = 15;
		spotLightRef.current.decay = 2;
		spotLightRef.current.color = new THREE.Color('#fff5e6');
	}, [camera]);

	useEffect(() => {
		const targetObject = new THREE.Object3D();
		scene.add(targetObject);
		spotLightRef.current.target = targetObject;

		return () => {
			scene.remove(targetObject);
		};
	}, [scene]);

<<<<<<< Updated upstream
	const flickerLight = useCallback(() => {
		let flickerInterval = setInterval(() => {
			setIntensity(Math.random() * DEFAULT_INTENSITY);
		}, 50);
=======
	// const flickerLight = useCallback(() => {
	// 	let flickerInterval = setInterval(() => {
	// 		// setIntensity(Math.random() * DEFAULT_INTENSITY * SIZE);
	// 	}, 50);
>>>>>>> Stashed changes

	// 	setTimeout(() => {
	// 		clearInterval(flickerInterval);
	// 		setIntensity(0);

<<<<<<< Updated upstream
			setTimeout(() => {
				flickerInterval = setInterval(() => {
					setIntensity(Math.random() * DEFAULT_INTENSITY);
				}, 50);

				setTimeout(() => {
					clearInterval(flickerInterval);
					setIntensity(DEFAULT_INTENSITY);
				}, 1000);
			}, FLICKER_DURATION);
		}, 1000);
	}, []);
=======
	// 		setTimeout(() => {
	// 			flickerInterval = setInterval(() => {
	// 				// setIntensity(Math.random() * DEFAULT_INTENSITY * SIZE);
	// 			}, 50);

	// 			// setTimeout(() => {
	// 			// 	clearInterval(flickerInterval);
	// 			// 	setIntensity(DEFAULT_INTENSITY * SIZE);
	// 			// }, 1000);
	// 		}, FLICKER_DURATION);
	// 	}, 1000);
	// }, []);
>>>>>>> Stashed changes

	const monsterRunFlicker = useCallback(() => {
		setIntensity((prev) => (Math.random() < 0.6 ? 0.1 : DEFAULT_INTENSITY));
	}, []);

	// useEffect(() => {
	// 	if (isFlickering) {
	// 		flickerLight();
	// 	}
	// }, [isFlickering, flickerLight]);

	useEffect(() => {
		let intervalId;
		if (monsterState === 'run') {
			intervalId = setInterval(monsterRunFlicker, 50);
		} else {
			setIntensity(DEFAULT_INTENSITY);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [monsterState, monsterRunFlicker]);

	useFrame((state) => {
		if (!playerRef.current) return;

		const position = playerRef.current;
		const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			state.camera.quaternion
		);
		const distance = 10;
		const backwardDistance = 0.4;

		const lightHeight = isCrouching ? 0.8 : 1.75;

		const lightPosition = new THREE.Vector3(
			position.x - cameraDirection.x * backwardDistance,
			position.y + lightHeight,
			position.z - cameraDirection.z * backwardDistance
		);

		spotLightRef.current.position.set(
			lightPosition.x,
			lightPosition.y,
			lightPosition.z
		);

		const targetPosition = new THREE.Vector3(
			position.x + cameraDirection.x * distance,
			position.y + cameraDirection.y * distance + 2,
			position.z + cameraDirection.z * distance
		);
		spotLightRef.current.target.position.copy(targetPosition);
	});

<<<<<<< Updated upstream
	return (
		<spotLight
			shadow-normalBias={0.04}
			intensity={intensity}
			castShadow
			ref={spotLightRef}
			power={20}
=======
	const playFlashlightSound = useCallback(() => {
		const volume = 0 + Math.random() * 0.2;

		flashlightSoundRef.current.pause();
		flashlightSoundRef.current.currentTime = 0;
		flashlightSoundRef.current.volume = volume;

		setTimeout(() => {
			flashlightSoundRef.current.play().catch(() => {});
		}, 1);
	}, []);

	useEffect(() => {
		if (!isPlayerHidden && spotLightRef.current) {
			playFlashlightSound();

			let lastIntensity = DEFAULT_INTENSITY * SIZE;
			const flashlightStartTime = Date.now();
			const flashlightFlickerInterval = setInterval(() => {
				const newIntensity = Math.random() < 0.5 ? 0 : DEFAULT_INTENSITY * SIZE;

				if (
					(lastIntensity === 0 && newIntensity > 0) ||
					(lastIntensity > 0 && newIntensity === 0)
				) {
					playFlashlightSound();
				}

				lastIntensity = newIntensity;
				setIntensity(newIntensity);

				if (Date.now() - flashlightStartTime > 500) {
					clearInterval(flashlightFlickerInterval);
					setIntensity(DEFAULT_INTENSITY * SIZE);
					playFlashlightSound();
				}
			}, 50);

			recoveryTimeoutRef.current = flashlightFlickerInterval;
			return () => {
				if (recoveryTimeoutRef.current) {
					clearInterval(recoveryTimeoutRef.current);
				}
			};
		}
	}, [isPlayerHidden, playFlashlightSound]);

	useEffect(() => {
		if (flashlightEnabled !== undefined) {
			playFlashlightSound();
		}
	}, [flashlightEnabled, playFlashlightSound]);

	useEffect(() => {
		if (isPlayerHidden) {
			// When hiding, we wait 1 second before turning off
			playFlashlightSound();
			setIsRecoveringFromHiding(true);

			const timeout = setTimeout(() => {
				setIsRecoveringFromHiding(false);
				playFlashlightSound();
			}, 1000);

			return () => clearTimeout(timeout);
		}
	}, [isPlayerHidden, playFlashlightSound]);

	return (
		<spotLight
			shadow-normalBias={0.04}
			intensity={
				(flashlightEnabled && !isPlayerHidden) || isRecoveringFromHiding
					? intensity
					: 0
				// 8
			}
			castShadow
			ref={spotLightRef}
			shadow-mapSize-width={performanceMode ? 1024 : 4}
			shadow-mapSize-height={performanceMode ? 1024 : 4}
			power={
				flashlightEnabled && (!isPlayerHidden || isRecoveringFromHiding)
					? 30 * SIZE
					: 0
			}
>>>>>>> Stashed changes
		/>
	);
}
