import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';
import useSettings from '../../hooks/useSettings';
import * as THREE from 'three';

const floor = -0.2;
const WALK_SPEED = 0.75;
const RUN_SPEED = 1.25;

const MOVEMENT_THRESHOLD = 0.00001;
const MAX_MOUSE_MOVEMENT = 100;

const applySensitivityCurve = (value, sensitivity, isJoystick = false) => {
	const sign = Math.sign(value);
	const absValue = Math.abs(value);

	if (isJoystick) {
		const adjustedSensitivity = sensitivity * 0.05;
		const normalizedValue = Math.max(0, absValue - 0.15) / 0.85;
		return sign * Math.pow(normalizedValue, 2) * adjustedSensitivity * 4;
	} else {
		return value * sensitivity * 8;
	}
};

const applyRotationWithDelta = (
	value,
	sensitivity,
	delta,
	isJoystick = false
) => {
	const baseRotation = applySensitivityCurve(value, sensitivity, isJoystick);

	return baseRotation * delta * 60;
};

export default function Rotation({
	playerPosition,
	playerVelocity,
	setIsRunning,
	disableControls,
	isCrouchingRef,
}) {
	const monsterState = useMonster((state) => state.monsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const deaths = useGame((state) => state.deaths);
	const deviceMode = useGame((state) => state.deviceMode);
	const isMobile = useGame((state) => state.isMobile);
	const isGameplayActive = useGame((state) => state.isGameplayActive);
	const isRunning = useGame((state) => state.isRunning);
	const jumpScare = useGame((state) => state.jumpScare);
	const temporaryDisableMouseLook = useGame(
		(state) => state.temporaryDisableMouseLook
	);
	const [subscribeKeys, getKeys] = useKeyboardControls();
	const { camera } = useThree();
	const getGamepadControls = useGamepadControls();
	const horizontalSensitivity = useSettings(
		(state) => state.horizontalSensitivity
	);
	const verticalSensitivity = useSettings((state) => state.verticalSensitivity);

	const rightStickRef = useJoysticksStore((state) => state.rightStickRef);
	const leftStickRef = useJoysticksStore((state) => state.leftStickRef);

	const yaw = useRef(-Math.PI);
	const pitch = useRef(0);
	const bobTimer = useRef(0);
	const bobIntensity = useRef(0);
	const hasMovedMouseAfterIntro = useRef(false);
	const introIsPlaying = useGame((state) => state.introIsPlaying);

	// Référence pour suivre la position précédente (comme dans FootSteps)
	const lastPosition = useRef(new THREE.Vector3());

	const reset = useCallback(() => {
		playerPosition.current.set(10.77, floor, -3);
		playerVelocity.current.set(0, 0, 0);

		camera.rotation.set(0, Math.PI, 0);
		yaw.current = -Math.PI;
		pitch.current = 0;
		hasMovedMouseAfterIntro.current = true;
	}, [camera, playerPosition, playerVelocity]);

	useEffect(() => {
		reset();
	}, [deaths, reset]);

	useEffect(() => {
		const unsubscribeReset = useGame.subscribe(
			(state) => state.phase,
			(value) => {
				if (value === 'ready') reset();
			}
		);
		const unsubscribeAny = subscribeKeys(() => {});

		return () => {
			unsubscribeReset();
			unsubscribeAny();
		};
	}, [subscribeKeys, reset]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
				setIsRunning(true);
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
				setIsRunning(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [setIsRunning]);

	useEffect(() => {
		const onMouseMove = (event) => {
			if (
				deviceMode === 'keyboard' &&
				monsterState !== 'run' &&
				document.pointerLockElement &&
				!temporaryDisableMouseLook &&
				!jumpScare &&
				isGameplayActive
			) {
				let movementX = event.movementX || 0;
				let movementY = event.movementY || 0;

				movementX = Math.max(
					-MAX_MOUSE_MOVEMENT,
					Math.min(MAX_MOUSE_MOVEMENT, movementX)
				);
				movementY = Math.max(
					-MAX_MOUSE_MOVEMENT,
					Math.min(MAX_MOUSE_MOVEMENT, movementY)
				);

				hasMovedMouseAfterIntro.current = true;

				yaw.current -= movementX * horizontalSensitivity * 0.008;
				pitch.current -= movementY * verticalSensitivity * 0.008;

				const maxPitch = Math.PI / 2 - 0.01;
				const minPitch = -Math.PI / 2 + 0.01;
				pitch.current = Math.max(minPitch, Math.min(maxPitch, pitch.current));

				camera.rotation.order = 'YXZ';
				camera.rotation.y = yaw.current;
				camera.rotation.x = pitch.current;
				camera.rotation.z = 0;
			}
		};

		document.addEventListener('mousemove', onMouseMove);
		return () => document.removeEventListener('mousemove', onMouseMove);
	}, [
		camera,
		deviceMode,
		monsterState,
		horizontalSensitivity,
		verticalSensitivity,
		disableControls,
		temporaryDisableMouseLook,
		jumpScare,
		isGameplayActive,
	]);

	useEffect(() => {
		if (disableControls) {
			hasMovedMouseAfterIntro.current = false;
		}
	}, [disableControls]);

	useFrame((state, delta) => {
		if (introIsPlaying) {
			return;
		}

		const velocity = new THREE.Vector3(
			playerVelocity.current.x,
			0,
			playerVelocity.current.z
		);
		const speed = velocity.length();

		const gamepadControls = getGamepadControls();
		const isUsingGamepad = deviceMode === 'gamepad';
		const gamepadRunning = isUsingGamepad && gamepadControls.run;
		const isPlayerRunning = isRunning || gamepadRunning;

		const { forward, backward, left, right } = getKeys();

		let keyForward = forward || gamepadControls.forward;
		let keyBackward = backward || gamepadControls.backward;
		let keyLeft = left || gamepadControls.left;
		let keyRight = right || gamepadControls.right;

		if (isMobile && leftStickRef.current) {
			if (Math.abs(leftStickRef.current.y) > 0.1) {
				keyForward = leftStickRef.current.y < 0;
				keyBackward = leftStickRef.current.y > 0;
			}
			if (Math.abs(leftStickRef.current.x) > 0.1) {
				keyLeft = leftStickRef.current.x < 0;
				keyRight = leftStickRef.current.x > 0;
			}
		}

		const keysPressed = keyForward || keyBackward || keyLeft || keyRight;

		const currentPosition = playerPosition.current;
		const movement = new THREE.Vector3().subVectors(
			currentPosition,
			lastPosition.current
		);
		const actuallyMoving = movement.lengthSq() > MOVEMENT_THRESHOLD;
		lastPosition.current.copy(currentPosition);

		const isActuallyMoving = keysPressed && actuallyMoving;

		if (
			isActuallyMoving &&
			monsterState !== 'run' &&
			!disableControls &&
			!isCrouchingRef.current
		) {
			let targetIntensity = 1.0;

			if (isUsingGamepad) {
				const leftStickMagnitude = Math.min(
					1,
					Math.sqrt(
						Math.pow(gamepadControls.leftStickX, 2) +
							Math.pow(gamepadControls.leftStickY, 2)
					)
				);

				targetIntensity = Math.max(0.1, leftStickMagnitude);
			}

			bobIntensity.current = THREE.MathUtils.lerp(
				bobIntensity.current,
				targetIntensity,
				delta * 3.0
			);

			const bobSpeed = isPlayerRunning ? 16 : 8;
			bobTimer.current += delta * bobSpeed;

			const bobAmplitude = 0.02 * bobIntensity.current;
			const bobOffset = Math.sin(bobTimer.current) * bobAmplitude;

			state.camera.position.y += bobOffset;

			const rollAmplitude = 0.004 * bobIntensity.current;
			camera.rotation.z = Math.sin(bobTimer.current * 0.5) * rollAmplitude;
		} else if (monsterState !== 'run') {
			bobIntensity.current = THREE.MathUtils.lerp(
				bobIntensity.current,
				0,
				delta * 5.0
			);

			if (bobIntensity.current > 0.01) {
				bobTimer.current += delta * 8;

				const bobAmplitude = 0.02 * bobIntensity.current;
				const bobOffset = Math.sin(bobTimer.current) * bobAmplitude;

				state.camera.position.y += bobOffset;

				const rollAmplitude = 0.004 * bobIntensity.current;
				camera.rotation.z = Math.sin(bobTimer.current * 0.5) * rollAmplitude;
			} else {
				camera.rotation.z = THREE.MathUtils.lerp(
					camera.rotation.z,
					0,
					delta * 5
				);
			}
		}

		if (
			(isMobile || deviceMode === 'gamepad') &&
			monsterState !== 'run' &&
			!disableControls &&
			!jumpScare
		) {
			const ROTATION_DEADZONE = 0.15;

			if (isMobile) {
				if (Math.abs(rightStickRef.current?.x) > ROTATION_DEADZONE) {
					yaw.current -= applyRotationWithDelta(
						rightStickRef.current.x,
						horizontalSensitivity,
						delta,
						true
					);
				}

				if (Math.abs(rightStickRef.current?.y) > ROTATION_DEADZONE) {
					pitch.current -= applyRotationWithDelta(
						rightStickRef.current.y,
						verticalSensitivity,
						delta,
						true
					);
				}
			} else if (deviceMode === 'gamepad' && isGameplayActive) {
				if (Math.abs(gamepadControls.rightStickX) > ROTATION_DEADZONE) {
					yaw.current -= applyRotationWithDelta(
						gamepadControls.rightStickX,
						horizontalSensitivity,
						delta,
						true
					);
				}

				if (Math.abs(gamepadControls.rightStickY) > ROTATION_DEADZONE) {
					pitch.current -= applyRotationWithDelta(
						gamepadControls.rightStickY,
						verticalSensitivity,
						delta,
						true
					);
				}
			}

			const maxPitch = Math.PI / 2 - 0.01;
			const minPitch = -Math.PI / 2 + 0.01;
			pitch.current = Math.max(minPitch, Math.min(maxPitch, pitch.current));

			state.camera.rotation.order = 'YXZ';
			state.camera.rotation.y = yaw.current;
			state.camera.rotation.x = pitch.current;
			state.camera.rotation.z = 0;
		}

		// Only apply automatic camera rotation in keyboard mode if user has moved mouse after intro
		if (
			deviceMode === 'keyboard' &&
			hasMovedMouseAfterIntro.current &&
			monsterState !== 'run' &&
			!jumpScare
		) {
			state.camera.rotation.order = 'YXZ';
			state.camera.rotation.y = yaw.current;
			state.camera.rotation.x = pitch.current;
		}
	});
}
