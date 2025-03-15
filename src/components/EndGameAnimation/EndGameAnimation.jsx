import { useEffect, useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls, button, folder } from 'leva';
import useGame from '../../hooks/useGame';
import useEndGameAnimation from '../../hooks/useEndGameAnimation';
import useLight from '../../hooks/useLight';
import useMonster from '../../hooks/useMonster';
import useDoor from '../../hooks/useDoor';
import { getAudioInstance } from '../../utils/audio';
import * as THREE from 'three';

const EndGameAnimation = () => {
	const { camera } = useThree();

	const isLerpingToCamera = useRef(false);
	const hasTriggeredAnimation = useRef(false);

	const setIsLocked = useGame((state) => state.setIsLocked);
	const setDisableControls = useGame((state) => state.setDisableControls);

	const setFlashlightEnabled = useLight((state) => state.setFlashlightEnabled);

	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const playAnimation = useMonster((state) => state.playAnimation);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);

	const exitDoor = useDoor((state) => state.exit);

	const {
		isPlaying,
		currentPosition,
		currentRotation,
		startAnimation,
		stopAnimation,
		updateAnimation,
		setPointFunction,
	} = useEndGameAnimation();

	const enableFlashlight = useCallback(() => {
		setFlashlightEnabled(true);
	}, [setFlashlightEnabled]);

	const startLerpingToCamera = useCallback(() => {
		console.log('Starting to lerp monster rotation toward camera');
		isLerpingToCamera.current = true;
	}, []);

	const hideMonster = useCallback(() => {
		setMonsterPosition([0, 10, 0]);
		setMonsterState('hidden');
		playAnimation('Idle');
		isLerpingToCamera.current = false;
	}, [setMonsterPosition, setMonsterState, playAnimation]);

	const triggerEndGameAnimation = useCallback(() => {
		if (hasTriggeredAnimation.current) return;

		hasTriggeredAnimation.current = true;

		// setMonsterPosition([10.3, 0.1, 0.05]);
		setMonsterPosition([10.7, -0.25, -0.4]);
		// const euler = new THREE.Euler(0, 3, 0);
		const euler = new THREE.Euler(0, 3.13, 0);
		setMonsterRotation([euler.x, euler.y, euler.z]);
		setMonsterState('');

		playAnimation('Punch');

		const punchSound = getAudioInstance('punch');
		if (punchSound) {
			punchSound.currentTime = 0;
			setTimeout(() => {
				punchSound.play();
			}, 1000);
		}

		startAnimation(
			camera.position.clone(),
			new THREE.Euler().setFromQuaternion(camera.quaternion)
		);

		setIsLocked(true);
		setDisableControls(true);
	}, [
		camera,
		playAnimation,
		setDisableControls,
		setIsLocked,
		setMonsterPosition,
		setMonsterRotation,
		setMonsterState,
		startAnimation,
	]);

	useEffect(() => {
		if (exitDoor && !isPlaying) {
			triggerEndGameAnimation();
		}
	}, [exitDoor, isPlaying, triggerEndGameAnimation]);

	useEffect(() => {
		setPointFunction(4, startLerpingToCamera);
		setPointFunction(5, enableFlashlight);

		return () => {
			hideMonster();
		};
	}, [setPointFunction, enableFlashlight, hideMonster, startLerpingToCamera]);

	useEffect(() => {
		if (!isPlaying) {
			hideMonster();
			hasTriggeredAnimation.current = false;
		}
	}, [isPlaying, hideMonster]);

	useControls('End Animation', {
		Controls: folder({
			startAnimation: button(() => {
				triggerEndGameAnimation();
			}),

			stopAnimation: button(() => {
				stopAnimation();
				hideMonster();
				setIsLocked(false);
				setDisableControls(false);
				hasTriggeredAnimation.current = false;
			}),
		}),
	});

	useFrame((_, delta) => {
		if (isPlaying) {
			updateAnimation(delta);

			camera.position.copy(currentPosition);

			const quaternion = new THREE.Quaternion().setFromEuler(currentRotation);
			camera.setRotationFromQuaternion(quaternion);

			camera.updateMatrixWorld(true);

			if (isLerpingToCamera.current) {
				const monsterPos = new THREE.Vector3(
					monsterPosition[0],
					monsterPosition[1],
					monsterPosition[2]
				);

				const direction = new THREE.Vector3();
				direction.subVectors(camera.position, monsterPos).normalize();

				const yaw = Math.atan2(direction.x, direction.z);

				const newRotation = new THREE.Euler(0, yaw, 0);

				const targetQuaternion = new THREE.Quaternion().setFromEuler(
					newRotation
				);
				const currentQuaternion = new THREE.Quaternion().setFromEuler(
					new THREE.Euler(
						monsterRotation[0],
						monsterRotation[1],
						monsterRotation[2]
					)
				);

				const resultQuaternion = new THREE.Quaternion();
				resultQuaternion.slerpQuaternions(
					currentQuaternion,
					targetQuaternion,
					Math.min(delta * 1.5, 1.0)
				);

				const resultEuler = new THREE.Euler().setFromQuaternion(
					resultQuaternion
				);

				setMonsterRotation([resultEuler.x, resultEuler.y, resultEuler.z]);
			}
		}
	});

	useEffect(() => {
		if (!isPlaying) {
			setIsLocked(false);
			setDisableControls(false);
		}
	}, [isPlaying, setIsLocked, setDisableControls]);

	return null;
};

export default EndGameAnimation;
