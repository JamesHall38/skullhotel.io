import { useEffect, useCallback, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useGame from '../hooks/useGame';
import useEndGameAnimation from '../hooks/useEndGameAnimation';
import useLight from '../hooks/useLight';
import useMonster from '../hooks/useMonster';
import useDoor from '../hooks/useDoor';
import useInterface from '../hooks/useInterface';
import { getAudioInstance, areSoundsLoaded } from '../utils/audio';
import * as THREE from 'three';

const DEFAULT_BATHROOM_POSITION = new THREE.Vector3(-1, 2, -3.2);
const BATHROOM_LIGHT_INTENSITY = 0.05;

const EndGameAnimation = () => {
	const { camera } = useThree();

	const isLerpingToCamera = useRef(false);
	const hasTriggeredAnimation = useRef(false);
	const fadeInterval = useRef(null);
	const endgameLightRef = useRef(null);
	const punchSoundRef = useRef(null);
	const [hasCompletedAnimation, setHasCompletedAnimation] = useState(false);

	const [lightPosition, setLightPosition] = useState([0, 0, 0]);

	const setIsLocked = useGame((state) => state.setIsLocked);
	const setDisableControls = useGame((state) => state.setDisableControls);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const bathroomLightRef = useGame((state) => state.bathroomLightRef);
	const setAlternateTutorialRoom = useGame(
		(state) => state.setAlternateTutorialRoom
	);
	const setIsEndAnimationPlaying = useGame(
		(state) => state.setIsEndAnimationPlaying
	);
	const setIsEndScreen = useGame((state) => state.setIsEndScreen);
	const endAnimationPlaying = useGame((state) => state.endAnimationPlaying);
	const setEndAnimationPlaying = useGame(
		(state) => state.setEndAnimationPlaying
	);
	const deaths = useGame((state) => state.deaths);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);

	const setFlashlightEnabled = useLight((state) => state.setFlashlightEnabled);

	const setFadeToBlack = useInterface((state) => state.setFadeToBlack);

	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const playAnimation = useMonster((state) => state.playAnimation);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);

	const setTutorialDoor = useDoor((state) => state.setTutorial);

	const {
		isPlaying,
		currentPosition,
		currentRotation,
		startAnimation,
		updateAnimation,
		setPointFunction,
		getPointPosition,
		stopAnimation,
	} = useEndGameAnimation();

	useEffect(() => {
		if (!isEndScreen) {
			setHasCompletedAnimation(false);
			hasTriggeredAnimation.current = false;
		}
	}, [deaths, isEndScreen]);

	const _tempQuaternion1 = new THREE.Quaternion();
	const _tempQuaternion2 = new THREE.Quaternion();
	const _tempQuaternion3 = new THREE.Quaternion();

	useEffect(() => {
		if (isPlaying) {
			if (bathroomLightRef) {
				bathroomLightRef.visible = false;
			}
		} else {
			if (bathroomLightRef) {
				bathroomLightRef.visible = true;
				bathroomLightRef.position.copy(DEFAULT_BATHROOM_POSITION);
				bathroomLightRef.color.set('#fff5e6');
				bathroomLightRef.intensity = BATHROOM_LIGHT_INTENSITY;
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
	}, [
		setMonsterPosition,
		setMonsterState,
		playAnimation,
		setFadeToBlack,
		setShakeIntensity,
	]);

	useEffect(() => {
		setMonsterPosition([0, 10, 0]);
		setMonsterState('hidden');

		const checkSounds = () => {
			if (areSoundsLoaded()) {
				punchSoundRef.current = getAudioInstance('punch');
				if (punchSoundRef.current) {
					punchSoundRef.current.load();
				} else {
					setTimeout(checkSounds, 100);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const triggerEndGameAnimation = useCallback(() => {
		if (hasTriggeredAnimation.current || hasCompletedAnimation) return;

		hasTriggeredAnimation.current = true;

		setTimeout(() => {
			if (window.steamAPI?.gameCompleted) {
				window.steamAPI.gameCompleted();
			}
		}, 2000);

		isLerpingToCamera.current = false;
		shouldFade.current = false;
		isFadingOut.current = false;
		setFadeToBlack(0);

		setIsLocked(true);
		setDisableControls(true);
		setIsGameplayActive(false);

		// Save the game end time
		useGame.getState().setGameEndTime();

		setTimeout(() => {
			setMonsterPosition([10.7, -0, -0.43]);
			const euler = new THREE.Euler(0, 3.13, 0);
			setMonsterRotation([euler.x, euler.y, euler.z]);
			setMonsterState('endAnimation');

			playAnimation('Punch');

			if (punchSoundRef.current) {
				try {
					punchSoundRef.current.currentTime = 0;
					punchSoundRef.current.play().catch((err) => {
						console.warn('Could not play punch sound:', err);
					});
				} catch (error) {
					console.warn('Error playing punch sound:', error);
				}
			}

			startAnimation(
				camera.position.clone(),
				new THREE.Euler().setFromQuaternion(camera.quaternion)
			);
		}, 10);
	}, [
		camera,
		playAnimation,
		setDisableControls,
		setIsLocked,
		setMonsterPosition,
		setMonsterRotation,
		setMonsterState,
		startAnimation,
		setFadeToBlack,
		hasCompletedAnimation,
		setIsGameplayActive,
	]);

	useEffect(() => {
		if (!hasCompletedAnimation && endAnimationPlaying && !isPlaying) {
			triggerEndGameAnimation();
		}
	}, [
		endAnimationPlaying,
		isPlaying,
		triggerEndGameAnimation,
		hasCompletedAnimation,
	]);

	const resetEndAnimation = useCallback(() => {
		hideMonster();
		hasTriggeredAnimation.current = false;
		setFadeToBlack(0);
		isFadingOut.current = false;
		shouldFade.current = false;
		isLerpingToCamera.current = false;
		stopAnimation();
		setIsEndAnimationPlaying(false);
		setEndAnimationPlaying(false);
		setHasCompletedAnimation(true);

		// Skip tutorial and start with 0/8 objectives
		useInterface.getState().setTutorialObjectives([true, true, true]);

		setTimeout(() => {
			camera.position.set(10.77, 1.5, -3);
			camera.rotation.set(0, Math.PI, 0);
			camera.updateMatrixWorld(true);
		}, 100);
	}, [
		hideMonster,
		setFadeToBlack,
		stopAnimation,
		setIsEndAnimationPlaying,
		setEndAnimationPlaying,
		camera,
	]);

	useEffect(() => {
		setPointFunction(0, () => {
			setIsEndAnimationPlaying(true);
			activateCameraShakeAndTutorial();
			startFadeToBlack();
			setAlternateTutorialRoom(true);
		});

		setPointFunction(1, () => {
			startLerpingToCamera();
		});

		setPointFunction(2, startFadeOut);

		setPointFunction(4, () => {
			setIsEndScreen(true);
			setFlashlightEnabled(true);
			resetEndAnimation();
		});

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
		setAlternateTutorialRoom,
		setIsEndAnimationPlaying,
		setIsEndScreen,
		setFlashlightEnabled,
		resetEndAnimation,
	]);

	useEffect(() => {
		if (!isPlaying) {
			hideMonster();
			hasTriggeredAnimation.current = false;

			setFadeToBlack(0);
			isFadingOut.current = false;
			shouldFade.current = false;
			isLerpingToCamera.current = false;

			if (fadeInterval.current) {
				clearInterval(fadeInterval.current);
				fadeInterval.current = null;
			}
		}
	}, [isPlaying, hideMonster, setFadeToBlack]);

	useFrame((_, delta) => {
		if (isPlaying && !hasCompletedAnimation) {
			const cappedDelta = Math.min(delta, 0.1);

			updateAnimation(cappedDelta);

			camera.position.copy(currentPosition);
			camera.quaternion.setFromEuler(currentRotation);
			camera.updateMatrixWorld(true);

			if (isFadingOut.current) {
				const currentOpacity = useInterface.getState().fadeToBlack;
				let newOpacity = currentOpacity - cappedDelta * fadeSpeed.current;
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

				const targetQuaternion = _tempQuaternion1 || new THREE.Quaternion();
				const currentQuaternion = _tempQuaternion2 || new THREE.Quaternion();
				const resultQuaternion = _tempQuaternion3 || new THREE.Quaternion();

				targetQuaternion.setFromEuler(newRotation);
				currentQuaternion.setFromEuler(
					new THREE.Euler(
						monsterRotation[0],
						monsterRotation[1],
						monsterRotation[2]
					)
				);

				resultQuaternion.slerpQuaternions(
					currentQuaternion,
					targetQuaternion,
					Math.min(cappedDelta * 1.5, 1.0)
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
				intensity={isPlaying ? BATHROOM_LIGHT_INTENSITY : 0}
				distance={10}
				position={lightPosition}
				castShadow={false}
			/>
		</>
	);
};

export default EndGameAnimation;
