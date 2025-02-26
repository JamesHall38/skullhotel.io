import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';
import useSettings from '../../hooks/useSettings';

const floor = -0.2;

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

export default function Rotation({
	playerPosition,
	playerVelocity,
	setIsRunning,
}) {
	const monsterState = useMonster((state) => state.monsterState);
	const deaths = useGame((state) => state.deaths);
	const deviceMode = useGame((state) => state.deviceMode);
	const isMobile = useGame((state) => state.isMobile);
	const [subscribeKeys] = useKeyboardControls();
	const { camera } = useThree();
	const getGamepadControls = useGamepadControls();
	const rotationSensitivity = useSettings((state) => state.rotationSensitivity);

	const rightStickRef = useJoysticksStore((state) => state.rightStickRef);

	const yaw = useRef(-Math.PI);
	const pitch = useRef(0);

	const reset = useCallback(() => {
		playerPosition.current.set(10.77, floor, -3);
		playerVelocity.current.set(0, 0, 0);

		camera.rotation.set(0, Math.PI, 0);
		yaw.current = -Math.PI;
		pitch.current = 0;
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

	// Ajouter un gestionnaire pour le mouvement de la souris
	useEffect(() => {
		const onMouseMove = (event) => {
			if (
				deviceMode === 'keyboard' &&
				monsterState !== 'run' &&
				document.pointerLockElement
			) {
				const movementX = event.movementX || 0;
				const movementY = event.movementY || 0;

				// Application linéaire de la sensibilité
				yaw.current -= movementX * rotationSensitivity * 0.008;
				pitch.current -= movementY * rotationSensitivity * 0.008;

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
	}, [camera, deviceMode, monsterState, rotationSensitivity]);

	useFrame((state) => {
		if ((isMobile || deviceMode === 'gamepad') && monsterState !== 'run') {
			const ROTATION_DEADZONE = 0.15;
			const gamepadControls = getGamepadControls();

			if (isMobile) {
				if (Math.abs(rightStickRef.current?.x) > ROTATION_DEADZONE) {
					yaw.current -= applySensitivityCurve(
						rightStickRef.current.x,
						rotationSensitivity,
						true
					);
				}

				if (Math.abs(rightStickRef.current?.y) > ROTATION_DEADZONE) {
					pitch.current -= applySensitivityCurve(
						rightStickRef.current.y,
						rotationSensitivity,
						true
					);
				}
			} else if (deviceMode === 'gamepad') {
				if (Math.abs(gamepadControls.rightStickX) > ROTATION_DEADZONE) {
					yaw.current -= applySensitivityCurve(
						gamepadControls.rightStickX,
						rotationSensitivity,
						true
					);
				}

				if (Math.abs(gamepadControls.rightStickY) > ROTATION_DEADZONE) {
					pitch.current -= applySensitivityCurve(
						gamepadControls.rightStickY,
						rotationSensitivity,
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
	});
}
