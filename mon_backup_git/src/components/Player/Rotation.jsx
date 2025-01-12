import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
// import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';

const floor = -0.2;

export default function Rotation({
	playerPosition,
	playerVelocity,
	setIsRunning,
}) {
	const monsterState = useMonster((state) => state.monsterState);
	const deaths = useGame((state) => state.deaths);
	// const deviceMode = useGame((state) => state.deviceMode);
	const isMobile = useGame((state) => state.isMobile);
	const [subscribeKeys] = useKeyboardControls();
	const { camera } = useThree();
	// const getGamepadControls = useGamepadControls();

	const rightStickRef = useJoysticksStore((state) => state.rightStickRef);

	const yaw = useRef(-Math.PI);
	const pitch = useRef(0);

	const reset = useCallback(() => {
		playerPosition.current.set(10.7, floor, -3);
		playerVelocity.current.set(0, 0, 0);

		camera.rotation.set(0, Math.PI, 0);
		// yaw.current = Math.PI / 2;
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

	useFrame((state) => {
		if (isMobile && monsterState !== 'run') {
			const rotationSpeed = 0.03;

			if (Math.abs(rightStickRef.current?.x) > 0.1) {
				yaw.current -= rightStickRef.current.x * rotationSpeed;
			}

			if (Math.abs(rightStickRef.current?.y) > 0.1) {
				pitch.current -= rightStickRef.current.y * rotationSpeed;
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
