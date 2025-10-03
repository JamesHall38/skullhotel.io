import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import { usePositionalSound } from '../../utils/audio';
import * as THREE from 'three';
import DetectionZone from '../DetectionZone';
import FabricMaterial from '../materials/FabricMaterial';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGamepadControls from '../../hooks/useGamepadControls';

const CORRIDORLENGTH = 5.95;
const offset = [8.833, 0.014, 6.2];

export default function Bedsheets() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const mobileClick = useGame((state) => state.mobileClick);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const seedData = useGame((state) => state.seedData);
	const setCursor = useInterface((state) => state.setCursor);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);
	const [isDetected, setIsDetected] = useState(false);
	const group = useRef();
	const { nodes, animations } = useGLTF('/models/objectives/bedsheets.glb');
	const mixerRef = useRef(new THREE.AnimationMixer(null));
	const [visibleMesh, setVisibleMesh] = useState('Start');
	const material = FabricMaterial({ isGrayscale: false });
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);
	const recentlyChangedObjectives = useInterface(
		(state) => state.recentlyChangedObjectives
	);
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[1]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const { camera } = useThree();
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);
	const progressConditionsRef = useRef(null);

	const bedsheetsSoundRef = useRef();

	const animationMeshClone = useMemo(() => {
		return nodes.Animated.clone();
	}, [nodes]);

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomCount / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomCount / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		} else {
			calculatedPosition = [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}

		if (isTutorialOpen) {
			calculatedPosition = [3.02, 0.02, 7.9];
		} else if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomCount, camera, isTutorialOpen]);

	useEffect(() => {
		const handleProgressComplete = () => {
			const savedConditions = progressConditionsRef.current;
			const currentCursor = useInterface.getState().cursor;

			if (savedConditions && currentCursor === 'clean-bedsheets') {
				if (
					savedConditions.isDetected &&
					!savedConditions.objective &&
					savedConditions.visibleMesh === 'Start' &&
					Math.abs(savedConditions.cameraZ) > 4.2
				) {
					const mixer = new THREE.AnimationMixer(animationMeshClone);
					animations.forEach((clip) => {
						if (clip.name === 'Bedsheets') {
							const action = mixer.clipAction(clip);
							action.clampWhenFinished = true;
							action.timeScale = 1;
							action.loop = THREE.LoopOnce;
							action.repetitions = 1;
							action.time = 0;
							action.play();
						}
					});
					mixerRef.current = mixer;
					setVisibleMesh('Animated');

					if (
						bedsheetsSoundRef.current &&
						!bedsheetsSoundRef.current.isPlaying
					) {
						bedsheetsSoundRef.current.play();
					}

					setTutorialObjectives([
						tutorialObjectives[0],
						true,
						tutorialObjectives[2],
					]);

					setCursor(null);
					setIsDetected(false);
				}
				progressConditionsRef.current = null;
			}
		};

		document.addEventListener('progressComplete', handleProgressComplete);
		return () => {
			document.removeEventListener('progressComplete', handleProgressComplete);
		};
	}, [
		animations,
		animationMeshClone,
		visibleMesh,
		roomNumber,
		tutorialObjectives,
		recentlyChangedObjectives,
		setTutorialObjectives,
		setInterfaceObjectives,
		isDetected,
		objective,
		setCursor,
		camera,
		seedData,
	]);

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			setVisibleMesh('Start');
			if (mixerRef.current) {
				mixerRef.current.stopAllAction();
				mixerRef.current.setTime(0);
			}
		} else {
			isInit.current = true;
			if (objective) {
				setVisibleMesh('End');
			}
		}
	}, [objective, roomNumber]);

	useEffect(() => {
		if (mobileClick && isDetected && visibleMesh === 'Start') {
			setIsDetected(true);
		}
	}, [mobileClick, isDetected, objective, visibleMesh, setMobileClick]);

	useFrame((_, delta) => {
		if (mixerRef.current) {
			mixerRef.current.update(delta);
			if (visibleMesh === 'Animated') {
				const action = mixerRef.current.existingAction(
					animations.find((a) => a.name === 'Bedsheets')
				);
				if (action && action.time >= action.getClip().duration - 0.1) {
					setVisibleMesh('End');
					if (!tutorialObjectives[1]) return;
					setInterfaceObjectives(1, roomNumber);
					const currentRoom = Object.values(seedData)[roomNumber];
					if (currentRoom?.hideObjective === 'bedsheets') {
						useGame
							.getState()
							.checkObjectiveCompletion('bedsheets', roomNumber);
					}
				}
			}
		}
	});

	const handleDetection = useCallback(() => {
		if (
			Math.abs(camera.position.z) < 4.2 || // To prevent detection through bathroom wall
			(camera.position.z < 5.9 &&
				camera.position.x > 1.9 &&
				camera.position.z > 0) // this condition is for the tutorial room
		) {
			return;
		}

		if (tutorialObjectives[1] === false) {
			setCursor('clean-bedsheets');
			setIsDetected(true);
			progressConditionsRef.current = {
				isDetected: true,
				objective,
				visibleMesh,
				cameraZ: camera.position.z,
			};
			return;
		}

		if (!objective && visibleMesh === 'Start') {
			setCursor('clean-bedsheets');
			setIsDetected(true);
			progressConditionsRef.current = {
				isDetected: true,
				objective,
				visibleMesh,
				cameraZ: camera.position.z,
			};
		}
	}, [setCursor, objective, tutorialObjectives, visibleMesh, camera]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (
				gamepadControls.action &&
				!wasActionPressedRef.current &&
				isDetected
			) {
				wasActionPressedRef.current = true;
				const event = new MouseEvent('mousedown', {
					bubbles: true,
					cancelable: true,
					button: 0,
				});
				document.dispatchEvent(event);
			} else if (!gamepadControls.action && wasActionPressedRef.current) {
				wasActionPressedRef.current = false;
				const event = new MouseEvent('mouseup', {
					bubbles: true,
					cancelable: true,
					button: 0,
				});
				document.dispatchEvent(event);
			}
		};

		const interval = setInterval(checkGamepad, 16);
		return () => clearInterval(interval);
	}, [deviceMode, gamepadControlsRef, isDetected]);

	return (
		<group
			ref={group}
			position={position}
			rotation={[0, position[2] < 0 ? Math.PI : 0, 0]}
			dispose={null}
		>
			<DetectionZone
				position={[-0.5, -0.2, 0]}
				scale={2}
				distance={3}
				onDetect={handleDetection}
				onDetectEnd={handleDetectionEnd}
				type="clean"
				name="bedsheets"
			/>

			<group scale={0.96} name="Scene">
				<mesh
					visible={visibleMesh === 'End'}
					name="End"
					geometry={nodes.End.geometry}
					material={material}
					receiveShadow
				/>
				<mesh
					visible={visibleMesh === 'Start'}
					name="Start"
					geometry={nodes.Start.geometry}
					material={material}
					receiveShadow
				/>

				<primitive
					position={[0, 0.05, 0]}
					visible={visibleMesh === 'Animated'}
					object={animationMeshClone}
					material={material}
					doubleSided={true}
				/>
			</group>
			<PositionalAudio
				ref={bedsheetsSoundRef}
				{...usePositionalSound('bedsheets')}
				loop={false}
			/>
		</group>
	);
}
