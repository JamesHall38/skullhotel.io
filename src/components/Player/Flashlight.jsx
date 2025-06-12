import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import useMonster from '../../hooks/useMonster';
import useLight from '../../hooks/useLight';
import useHiding from '../../hooks/useHiding';
import { useFrame, useThree } from '@react-three/fiber';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import useInterface from '../../hooks/useInterface';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGame from '../../hooks/useGame';

const LERP_FACTOR = 0.15;
const DEFAULT_INTENSITY = 8;
const SIZE = 0.85;
const RING_OPACITY = 0.03;
const LIGHT_TEXTURE_SIZE = 256;

export default function Flashlight({ playerRef, crouchProgressRef }) {
	const monsterState = useMonster((state) => state.monsterState);
	const animationName = useMonster((state) => state.animationName);
	const flashlightEnabled = useLight((state) => state.flashlightEnabled);
	const isPlayerHidden = useHiding((state) => state.isPlayerHidden);
	const disableControls = useGame((state) => state.disableControls);
	const monsterAttackDisableControls = useGame(
		(state) => state.monsterAttackDisableControls
	);
	const spotLightRef = useRef();
	const targetRef = useRef(new THREE.Vector3());
	const currentLightPos = useRef(new THREE.Vector3());
	const lastCameraQuaternion = useRef(new THREE.Quaternion());
	const { scene } = useThree();
	const [intensity, setIntensity] = useState(0);
	const recoveryTimeoutRef = useRef(null);
	const [soundsReady, setSoundsReady] = useState(false);
	const flashlightSoundRef = useRef(null);
	const [isRecoveringFromHiding, setIsRecoveringFromHiding] = useState(false);
	const lightTextureRef = useRef(null);
	const doneObjectives = useInterface((state) => state.interfaceObjectives);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const doneObjectivesNumberRef = useRef(doneObjectives);
	const jumpscareLerpTimeRef = useRef(0);
	const wasDisabledRef = useRef(false);

	const doneObjectivesNumber = useMemo(() => {
		const count = doneObjectives?.reduce((acc, subArray) => {
			if (subArray.every(Boolean)) {
				return acc + 1;
			}
			return acc;
		}, 0);
		return count;
	}, [doneObjectives]);

	useEffect(() => {
		doneObjectivesNumberRef.current = doneObjectivesNumber || 0;
	}, [doneObjectivesNumber]);

	useEffect(() => {
		const canvas = document.createElement('canvas');
		canvas.width = LIGHT_TEXTURE_SIZE;
		canvas.height = LIGHT_TEXTURE_SIZE;
		const context = canvas.getContext('2d');

		context.fillStyle = 'black';
		context.fillRect(0, 0, LIGHT_TEXTURE_SIZE, LIGHT_TEXTURE_SIZE);

		const mainGradient = context.createRadialGradient(
			LIGHT_TEXTURE_SIZE / 2,
			LIGHT_TEXTURE_SIZE / 2,
			0,
			LIGHT_TEXTURE_SIZE / 2,
			LIGHT_TEXTURE_SIZE / 2,
			100 * SIZE
		);

		mainGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
		mainGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
		mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

		context.fillStyle = mainGradient;
		context.fillRect(0, 0, LIGHT_TEXTURE_SIZE, LIGHT_TEXTURE_SIZE);

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
				LIGHT_TEXTURE_SIZE / 2,
				LIGHT_TEXTURE_SIZE / 2,
				index < 3 ? 0 : ring.radius - ring.width / 2,
				LIGHT_TEXTURE_SIZE / 2,
				LIGHT_TEXTURE_SIZE / 2,
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
			context.fillRect(0, 0, LIGHT_TEXTURE_SIZE, LIGHT_TEXTURE_SIZE);
		});

		context.shadowBlur = 0;

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;

		lightTextureRef.current = texture;
	}, []);

	useEffect(() => {
		const targetObject = new THREE.Object3D();
		scene.add(targetObject);
		spotLightRef.current.target = targetObject;

		return () => {
			scene.remove(targetObject);
		};
	}, [scene]);

	const monsterRunFlicker = useCallback(() => {
		setIntensity(() =>
			Math.random() < 0.6 ? 0.1 * SIZE : DEFAULT_INTENSITY * SIZE
		);
	}, []);

	useEffect(() => {
		let intervalId;

		if (monsterState === 'run') {
			intervalId = setInterval(monsterRunFlicker, 50);
		} else if (animationName === 'Attack') {
			intervalId = setInterval(monsterRunFlicker, 50);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [monsterState, animationName, monsterRunFlicker]);

	useFrame((state, delta) => {
		if (!playerRef.current) return;

		const position = playerRef.current;
		const camera = state.camera;
		const currentQuaternion = camera.quaternion.clone();

		if (disableControls && !monsterAttackDisableControls) {
			if (!wasDisabledRef.current) {
				jumpscareLerpTimeRef.current = 0;
				wasDisabledRef.current = true;
			}

			jumpscareLerpTimeRef.current += delta;

			const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
				camera.quaternion
			);

			const lightPosition = new THREE.Vector3(
				camera.position.x - cameraDirection.x * 0.2,
				1.4,
				camera.position.z - cameraDirection.z * 0.2
			);

			const targetPosition = new THREE.Vector3(
				camera.position.x + cameraDirection.x * 20,
				1.4,
				camera.position.z + cameraDirection.z * 20
			);

			spotLightRef.current.position.copy(lightPosition);
			spotLightRef.current.target.position.copy(targetPosition);
			currentLightPos.current.copy(lightPosition);
			targetRef.current.copy(targetPosition);

			lastCameraQuaternion.current.copy(currentQuaternion);
			return;
		} else if (wasDisabledRef.current) {
			wasDisabledRef.current = false;
			jumpscareLerpTimeRef.current = 0;
		}

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

		const adjustedLerpFactor = Math.min(LERP_FACTOR * delta * 60, 1);

		currentLightPos.current.lerp(desiredPosition, adjustedLerpFactor);
		spotLightRef.current.position.copy(currentLightPos.current);

		const desiredTarget = new THREE.Vector3(
			position.x + anticipatedDirection.x * distance,
			position.y + anticipatedDirection.y * distance + 2,
			position.z + anticipatedDirection.z * distance
		);

		targetRef.current.lerp(desiredTarget, adjustedLerpFactor);
		spotLightRef.current.target.position.copy(targetRef.current);

		lastCameraQuaternion.current.copy(currentQuaternion);

		if (flashlightEnabled && !isPlayerHidden) {
			const progressPercentage = doneObjectivesNumberRef.current / roomCount;
			const flickerProbability =
				progressPercentage * progressPercentage * 0.0006;

			if (Math.random() < flickerProbability * (1 / delta)) {
				setIntensity(DEFAULT_INTENSITY * SIZE * 0.5);
				setTimeout(() => {
					setIntensity(DEFAULT_INTENSITY * SIZE);
				}, 50);
			}
		}
	});

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				flashlightSoundRef.current = getAudioInstance('flashlight');
				if (flashlightSoundRef.current) {
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (flashlightSoundRef.current) {
				flashlightSoundRef.current.pause();
				flashlightSoundRef.current.currentTime = 0;
			}
		};
	}, []);

	const playFlashlightSound = useCallback(() => {
		if (!soundsReady) return;

		const volume = 0 + Math.random() * 0.2;
		const audio = flashlightSoundRef.current;

		audio.pause();
		audio.currentTime = 0;
		audio.volume = volume;

		setTimeout(() => {
			audio.play().catch(() => {});
		}, 1);
	}, [soundsReady]);

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
			}
			castShadow
			ref={spotLightRef}
			shadow-mapSize-width={1024}
			shadow-mapSize-height={1024}
			power={
				flashlightEnabled && (!isPlayerHidden || isRecoveringFromHiding)
					? 30 * SIZE
					: 0
			}
			map={lightTextureRef.current}
			angle={Math.PI / 5}
			penumbra={0.3}
			distance={18 * SIZE}
			decay={1.8}
			color={new THREE.Color('#fff5e6')}
		/>
	);
}
