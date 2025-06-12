import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations, PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';
import DetectionZone from '../DetectionZone';
import { usePositionalSound } from '../../utils/audio';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGamepadControls from '../../hooks/useGamepadControls';

const CORRIDORLENGTH = 5.95;
const offset = [9.53, 0.83, 1.6];

export default function Bottles() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deviceMode = useGame((state) => state.deviceMode);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);
	const group = useRef();
	const { nodes, materials, animations } = useGLTF(
		'/models/objectives/bottles.glb'
	);
	const { actions } = useAnimations(animations, group);
	const { camera } = useThree();
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);
	const recentlyChangedObjectives = useInterface(
		(state) => state.recentlyChangedObjectives
	);
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[0]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const [delayedBathroomCurtain, setDelayedBathroomCurtain] =
		useState(bathroomCurtain);
	const [isDetected, setIsDetected] = useState(false);
	const setCursor = useInterface((state) => state.setCursor);
	const progressConditionsRef = useRef(null);

	const bottleSoundRef = useRef();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDelayedBathroomCurtain(bathroomCurtain);
		}, 500);

		return () => clearTimeout(timeout);
	}, [bathroomCurtain]);

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
			calculatedPosition = [2.32, 0 + offset[1], 3.28];
		} else if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomCount, camera, isTutorialOpen]);

	const handleDetection = useCallback(() => {
		if (camera.position.x > 1.8 && camera.position.z > 3) {
			if (bathroomCurtain && tutorialObjectives[0] === false) {
				setCursor('clean-bottles');
				setIsDetected(true);
				progressConditionsRef.current = {
					isDetected: true,
					delayedBathroomCurtain: bathroomCurtain,
				};
			}
		} else if (
			!objective &&
			Math.abs(camera.position.z) > 0.4 &&
			bathroomCurtain
		) {
			setCursor('clean-bottles');
			setIsDetected(true);
			progressConditionsRef.current = {
				isDetected: true,
				delayedBathroomCurtain: bathroomCurtain,
			};
		}
	}, [
		setCursor,
		camera,
		bathroomCurtain,
		objective,
		tutorialObjectives,
		delayedBathroomCurtain,
	]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	useEffect(() => {
		const handleProgressComplete = () => {
			const savedConditions = progressConditionsRef.current;
			const currentCursor = useInterface.getState().cursor;

			if (savedConditions && currentCursor === 'clean-bottles') {
				if (
					savedConditions.isDetected &&
					savedConditions.delayedBathroomCurtain
				) {
					setCursor(null);

					Object.values(actions).forEach((action) => {
						if (!action.isRunning()) {
							if (action && action.time !== action.getClip().duration) {
								action.clampWhenFinished = true;
								action.loop = THREE.LoopOnce;
								action.repetitions = 1;

								setTimeout(() => {
									if (bottleSoundRef.current) {
										bottleSoundRef.current.play();
									}
								}, 600);

								action.play();
								if (
									!tutorialObjectives.every((value) => value === true) &&
									!recentlyChangedObjectives[0]
								) {
									setTutorialObjectives([
										true,
										tutorialObjectives[1],
										tutorialObjectives[2],
									]);
								} else {
									setInterfaceObjectives(0, roomNumber);
									const currentRoom = Object.values(
										useGame.getState().seedData
									)[roomNumber];
									if (currentRoom?.hideObjective === 'bottles') {
										useGame
											.getState()
											.checkObjectiveCompletion('bottles', roomNumber, camera);
									}
								}
							}
						}
					});

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
		camera,
		actions,
		delayedBathroomCurtain,
		isDetected,
		setInterfaceObjectives,
		roomNumber,
		setTutorialObjectives,
		tutorialObjectives,
		recentlyChangedObjectives,
		setCursor,
	]);

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			Object.values(actions).forEach((action) => {
				if (action) {
					action.stop();
					action.reset();
					action.time = 0;
				}
			});
		} else {
			isInit.current = true;
			if (objective) {
				Object.values(actions).forEach((action) => {
					if (!action.isRunning()) {
						if (action && action.time !== action.getClip().duration) {
							action.clampWhenFinished = true;
							action.loop = THREE.LoopOnce;
							action.repetitions = 1;
							action.play();
							action.time = action.getClip().duration;
						}
					}
				});
			}
		}
	}, [objective, actions]);

	useEffect(() => {
		if (tutorialObjectives[0] === false && isInit.current === true) {
			Object.values(actions).forEach((action) => {
				if (action) {
					action.stop();
					action.reset();
				}
			});
		} else {
			isInit.current = true;
		}
	}, [tutorialObjectives, actions]);

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
				position={[0, 0.2, 0.1]}
				scale={[0.5, 0.5, 0.05]}
				distance={2}
				number={1}
				onDetect={handleDetection}
				onDetectEnd={handleDetectionEnd}
				key={bathroomCurtain}
				type="clean"
				name="bottles"
			/>
			<group name="Scene">
				<group name="BottleRight">
					<mesh
						name="Cylinder013"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder013.geometry}
						material={materials['1.003']}
					/>
					<mesh
						name="Cylinder013_1"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder013_1.geometry}
						material={materials.g1}
					/>
				</group>
				<group name="BottleLeft" rotation={[-Math.PI / 2, 0.056, 0]}>
					<mesh
						name="Cylinder008"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008.geometry}
						material={materials['89']}
					/>
					<mesh
						name="Cylinder008_1"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008_1.geometry}
						material={materials['3-1']}
					/>
					<mesh
						name="Cylinder008_2"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008_2.geometry}
						material={materials['2-2.001']}
					/>
				</group>
			</group>
			<PositionalAudio
				ref={bottleSoundRef}
				{...usePositionalSound('bottles')}
				loop={false}
			/>
		</group>
	);
}
