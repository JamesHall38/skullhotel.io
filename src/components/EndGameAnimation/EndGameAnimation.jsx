import { useEffect, useCallback, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useEndGameAnimation from '../../hooks/useEndGameAnimation';
import useLight from '../../hooks/useLight';
import useMonster from '../../hooks/useMonster';
import useDoor from '../../hooks/useDoor';
import useInterface from '../../hooks/useInterface';
import { getAudioInstance } from '../../utils/audio';
import * as THREE from 'three';

const DEFAULT_BATHROOM_POSITION = new THREE.Vector3(-1, 2, -3.2);

const EndGameAnimation = () => {
	const { camera } = useThree();

	const isLerpingToCamera = useRef(false);
	const hasTriggeredAnimation = useRef(false);
	const fadeInterval = useRef(null);
	const endgameLightRef = useRef(null);

	const [lightVisible, setLightVisible] = useState(false);
	const [lightPosition, setLightPosition] = useState([0, 0, 0]);

	const setIsLocked = useGame((state) => state.setIsLocked);
	const setDisableControls = useGame((state) => state.setDisableControls);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const resetBathroomLightPosition = useGame(
		(state) => state.resetBathroomLightPosition
	);
	const setBathroomLightEndgameMode = useGame(
		(state) => state.setBathroomLightEndgameMode
	);
	const bathroomLightRef = useGame((state) => state.bathroomLightRef);

	const setFlashlightEnabled = useLight((state) => state.setFlashlightEnabled);

	const setFadeToBlack = useInterface((state) => state.setFadeToBlack);

	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const playAnimation = useMonster((state) => state.playAnimation);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);

	const exitDoor = useDoor((state) => state.exit);
	const openDoor = useDoor((state) => state.open);
	const setTutorialDoor = useDoor((state) => state.setTutorial);

	const {
		isPlaying,
		currentPosition,
		currentRotation,
		startAnimation,
		updateAnimation,
		setPointFunction,
		getPointPosition,
	} = useEndGameAnimation();

	useEffect(() => {
		if (isPlaying) {
			setLightVisible(true);

			if (bathroomLightRef) {
				bathroomLightRef.visible = false;
			}
		} else {
			setLightVisible(false);

			if (bathroomLightRef) {
				bathroomLightRef.visible = true;
				bathroomLightRef.position.copy(DEFAULT_BATHROOM_POSITION);
				bathroomLightRef.color.set('#fff5e6');
				bathroomLightRef.intensity = 0.3;
			}
		}
	}, [isPlaying, bathroomLightRef]);

	const enableFlashlight = useCallback(() => {
		setFlashlightEnabled(true);
	}, [setFlashlightEnabled]);

	const startLerpingToCamera = useCallback(() => {
		isLerpingToCamera.current = true;
		shouldFade.current = false;
	}, []);

	const startFadeToBlack = useCallback(() => {
		if (fadeInterval.current) {
			clearInterval(fadeInterval.current);
			fadeInterval.current = null;
		}

		setFadeToBlack(1);
	}, [setFadeToBlack]);

	const startFadeOut = useCallback(() => {
		isFadingOut.current = true;

		if (endgameLightRef.current) {
			const point2Position = getPointPosition(2);
			setLightPosition([point2Position.x, point2Position.y, point2Position.z]);
		}
	}, [getPointPosition]);

	const activateCameraShakeAndTutorial = useCallback(() => {
		setShakeIntensity(10);
		setFlashlightEnabled(false);
		setBathroomLight(true);

		if (endgameLightRef.current) {
			const point0Position = getPointPosition(0);
			setLightPosition([point0Position.x, point0Position.y, point0Position.z]);
		}

		setTutorialDoor(true);
	}, [
		setShakeIntensity,
		setFlashlightEnabled,
		setBathroomLight,
		setTutorialDoor,
		getPointPosition,
	]);

	const fadeSpeed = useRef(0.5);
	const shouldFade = useRef(false);
	const isFadingOut = useRef(false);
	const punchSoundPlayed = useRef(false);
	const punchSoundDelay = useRef(1.0);
	const punchSoundTimer = useRef(0);

	const hideMonster = useCallback(() => {
		setMonsterPosition([0, 10, 0]);
		setMonsterState('hidden');
		playAnimation('Idle');
		isLerpingToCamera.current = false;
		shouldFade.current = false;
		isFadingOut.current = false;

		if (fadeInterval.current) {
			clearInterval(fadeInterval.current);
			fadeInterval.current = null;
		}
		setFadeToBlack(0);
		setShakeIntensity(0);

		setLightVisible(false);
	}, [
		setMonsterPosition,
		setMonsterState,
		playAnimation,
		setFadeToBlack,
		setShakeIntensity,
	]);

	const triggerEndGameAnimation = useCallback(() => {
		if (hasTriggeredAnimation.current) return;

		hasTriggeredAnimation.current = true;

		setMonsterPosition([10.7, -0.25, -0.4]);
		const euler = new THREE.Euler(0, 3.13, 0);
		setMonsterRotation([euler.x, euler.y, euler.z]);
		setMonsterState('');

		playAnimation('Punch');

		punchSoundPlayed.current = false;
		punchSoundTimer.current = 0;

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
		setPointFunction(0, activateCameraShakeAndTutorial);

		setPointFunction(1, () => {
			startLerpingToCamera();
			startFadeToBlack();
		});

		setPointFunction(2, startFadeOut);

		setPointFunction(3, null);

		setPointFunction(5, enableFlashlight);

		return () => {
			hideMonster();
		};
	}, [
		setPointFunction,
		enableFlashlight,
		hideMonster,
		startLerpingToCamera,
		startFadeToBlack,
		startFadeOut,
		activateCameraShakeAndTutorial,
	]);

	useEffect(() => {
		if (!isPlaying) {
			hideMonster();
			hasTriggeredAnimation.current = false;
		}
	}, [isPlaying, hideMonster]);

	useEffect(() => {
		return () => {
			setBathroomLightEndgameMode(false);
			resetBathroomLightPosition();

			if (fadeInterval.current) {
				clearInterval(fadeInterval.current);
			}

			if (bathroomLightRef) {
				bathroomLightRef.visible = true;
			}
		};
	}, [
		resetBathroomLightPosition,
		setBathroomLightEndgameMode,
		bathroomLightRef,
	]);

	useFrame((_, delta) => {
		if (isPlaying) {
			updateAnimation(delta);

			camera.position.copy(currentPosition);

			const quaternion = new THREE.Quaternion().setFromEuler(currentRotation);
			camera.setRotationFromQuaternion(quaternion);

			camera.updateMatrixWorld(true);

			if (!punchSoundPlayed.current) {
				punchSoundTimer.current += delta;
				if (punchSoundTimer.current >= punchSoundDelay.current) {
					const punchSound = getAudioInstance('punch');
					if (punchSound) {
						punchSound.currentTime = 0;
						punchSound.play();
					}
					punchSoundPlayed.current = true;
				}
			}

			if (isFadingOut.current) {
				const currentOpacity = useInterface.getState().fadeToBlack;
				let newOpacity = currentOpacity - delta * fadeSpeed.current;
				if (newOpacity <= 0) {
					newOpacity = 0;
					isFadingOut.current = false;
				}
				setFadeToBlack(newOpacity);
			}

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
			shouldFade.current = false;
			isFadingOut.current = false;
		}
	}, [isPlaying]);

	useEffect(() => {
		if (!isPlaying) {
			setIsLocked(false);
			setDisableControls(false);
		}
	}, [isPlaying, setIsLocked, setDisableControls]);

	return (
		<>
			<pointLight
				ref={endgameLightRef}
				color="#fff5e6"
				intensity={1.8}
				distance={10}
				position={lightPosition}
				visible={lightVisible}
				castShadow={false}
			/>
		</>
	);
};

export default EndGameAnimation;
