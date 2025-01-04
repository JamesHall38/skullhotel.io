import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useLight from '../../hooks/useLight';
import useHiding from '../../hooks/useHiding';
import { useFrame, useThree } from '@react-three/fiber';

const FLICKER_DURATION = 10000;
const LERP_FACTOR = 0.05;
const DEFAULT_INTENSITY = 8;
const SIZE = 0.85;
const RING_OPACITY = 0.03;

export default function Flashlight({
	playerRef,
	isCrouchingRef,
	crouchProgressRef,
}) {
	const isFlickering = useGame((state) => state.isFlickering);
	const monsterState = useMonster((state) => state.monsterState);
	const flashlightEnabled = useLight((state) => state.flashlightEnabled);
	const isPlayerHidden = useHiding((state) => state.isPlayerHidden);
	const spotLightRef = useRef();
	const targetRef = useRef(new THREE.Vector3());
	const currentLightPos = useRef(new THREE.Vector3());
	const lastCameraQuaternion = useRef(new THREE.Quaternion());
	const { scene, camera } = useThree();
	const [intensity, setIntensity] = useState(0);
	const recoveryTimeoutRef = useRef(null);
	const flashlightSoundRef = useRef(new Audio('/sounds/flashlight.ogg'));
	const [isRecoveringFromHiding, setIsRecoveringFromHiding] = useState(false);

	useEffect(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		const context = canvas.getContext('2d');

		context.fillStyle = 'black';
		context.fillRect(0, 0, 256, 256);

		const mainGradient = context.createRadialGradient(
			128,
			128,
			0,
			128,
			128,
			100 * SIZE
		);

		mainGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
		mainGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
		mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

		context.fillStyle = mainGradient;
		context.fillRect(0, 0, 256, 256);

		const rings = [
			{
				radius: 5 * SIZE,
				width: 6 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},
			{
				radius: 10 * SIZE,
				width: 6 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},
			{
				radius: 15 * SIZE,
				width: 6 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},

			{
				radius: 25 * SIZE,
				width: 6 * SIZE,
				opacity: 1 * RING_OPACITY,
				isDark: false,
			},
			{
				radius: 35 * SIZE,
				width: 6 * SIZE,
				opacity: 1 * RING_OPACITY,
				isDark: false,
			},
			{
				radius: 45 * SIZE,
				width: 6 * SIZE,
				opacity: 1 * RING_OPACITY,
				isDark: false,
			},

			{
				radius: 55 * SIZE,
				width: 8 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},
			{
				radius: 70 * SIZE,
				width: 8 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},
			{
				radius: 85 * SIZE,
				width: 8 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: true,
			},

			{
				radius: 95 * SIZE,
				width: 8 * SIZE,
				opacity: 1 * RING_OPACITY,
				isDark: false,
			},
			{
				radius: 100 * SIZE,
				width: 4 * SIZE,
				opacity: 2 * RING_OPACITY,
				isDark: false,
			},
		];

		rings.forEach((ring, index) => {
			const ringGradient = context.createRadialGradient(
				128,
				128,
				index < 3 ? 0 : ring.radius - ring.width / 2,
				128,
				128,
				ring.radius + ring.width / 2
			);

			const color = ring.isDark ? '0, 0, 0' : '255, 255, 255';

			if (index < 3) {
				ringGradient.addColorStop(0, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(0.5, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(1, `rgba(${color}, 0)`);
			} else if (index >= 6 && index <= 8) {
				ringGradient.addColorStop(0, `rgba(${color}, 0)`);
				ringGradient.addColorStop(0.3, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(0.7, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(1, `rgba(${color}, 0)`);
			} else {
				ringGradient.addColorStop(0, `rgba(${color}, 0)`);
				ringGradient.addColorStop(0.3, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(0.7, `rgba(${color}, ${ring.opacity})`);
				ringGradient.addColorStop(1, `rgba(${color}, 0)`);
			}

			context.fillStyle = ringGradient;
			context.fillRect(0, 0, 256, 256);
		});

		context.shadowBlur = 0;

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;

		spotLightRef.current.map = texture;
		spotLightRef.current.angle = Math.PI / 5;
		spotLightRef.current.penumbra = 0.3;
		spotLightRef.current.distance = 18 * SIZE;
		spotLightRef.current.decay = 1.8;
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

	const flickerLight = useCallback(() => {
		let flickerInterval = setInterval(() => {
			// setIntensity(Math.random() * DEFAULT_INTENSITY * SIZE);
		}, 50);

		setTimeout(() => {
			clearInterval(flickerInterval);
			setIntensity(0);

			setTimeout(() => {
				flickerInterval = setInterval(() => {
					// setIntensity(Math.random() * DEFAULT_INTENSITY * SIZE);
				}, 50);

				// setTimeout(() => {
				// 	clearInterval(flickerInterval);
				// 	setIntensity(DEFAULT_INTENSITY * SIZE);
				// }, 1000);
			}, FLICKER_DURATION);
		}, 1000);
	}, []);

	const monsterRunFlicker = useCallback(() => {
		setIntensity((prev) =>
			Math.random() < 0.6 ? 0.1 * SIZE : DEFAULT_INTENSITY * SIZE
		);
	}, []);

	useEffect(() => {
		if (isFlickering) {
			flickerLight();
		}
	}, [isFlickering, flickerLight]);

	useEffect(() => {
		let intervalId;
		if (monsterState === 'run') {
			intervalId = setInterval(monsterRunFlicker, 50);
		}
		// else {
		// 	setIntensity(DEFAULT_INTENSITY * SIZE);
		// }

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [monsterState, monsterRunFlicker]);

	useFrame((state) => {
		if (!playerRef.current) return;

		const position = playerRef.current;
		const currentQuaternion = state.camera.quaternion.clone();

		const rotationDelta = new THREE.Quaternion();
		rotationDelta
			.copy(currentQuaternion)
			.multiply(lastCameraQuaternion.current.invert());

		const rotationChange = new THREE.Euler().setFromQuaternion(rotationDelta);

		const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			currentQuaternion
		);

		const anticipatedDirection = cameraDirection.clone();
		anticipatedDirection.x += rotationChange.y;
		anticipatedDirection.normalize();

		const distance = 10;
		const backwardDistance = 0.4;
		const standingHeight = 1.75;
		const crouchHeight = 0.8;
		const lightHeight =
			standingHeight -
			(standingHeight - crouchHeight) * crouchProgressRef.current;

		const desiredPosition = new THREE.Vector3(
			position.x - anticipatedDirection.x * backwardDistance,
			position.y + lightHeight,
			position.z - anticipatedDirection.z * backwardDistance
		);

		currentLightPos.current.lerp(desiredPosition, LERP_FACTOR);
		spotLightRef.current.position.copy(currentLightPos.current);

		const desiredTarget = new THREE.Vector3(
			position.x + anticipatedDirection.x * distance,
			position.y + anticipatedDirection.y * distance + 2,
			position.z + anticipatedDirection.z * distance
		);

		targetRef.current.lerp(desiredTarget, LERP_FACTOR);
		spotLightRef.current.target.position.copy(targetRef.current);

		lastCameraQuaternion.current.copy(currentQuaternion);
	});

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
			// Quand on se cache, on attend 1 seconde avant d'éteindre
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
				flashlightEnabled && (!isPlayerHidden || isRecoveringFromHiding)
					? intensity
					: 0
			}
			castShadow
			ref={spotLightRef}
			power={
				flashlightEnabled && (!isPlayerHidden || isRecoveringFromHiding)
					? 30 * SIZE
					: 0
			}
		/>
	);
}
