import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations, PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';
import levelData from '../Monster/Triggers/levelData';
import DetectionZone from '../DetectionZone';
import { usePositionalSound } from '../../utils/audio';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGamepadControls from '../../hooks/useGamepadControls';

const CORRIDORLENGTH = 5.95;
const offset = [8.43, 1.13, 12];

export default function Window() {
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);
	const group = useRef();
	const { nodes, animations } = useGLTF('/models/objectives/window.glb');
	const { actions } = useAnimations(animations, group);
	const { camera } = useThree();
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);
	const recentlyChangedObjectives = useInterface(
		(state) => state.recentlyChangedObjectives
	);
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[2]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const [delayedRoomCurtain, setDelayedRoomCurtain] = useState(roomCurtain);
	const [isDetected, setIsDetected] = useState(false);
	const setCursor = useInterface((state) => state.setCursor);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);
	const progressConditionsRef = useRef(null);

	const windowSound = usePositionalSound('window');
	const windowSoundRef = useRef();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDelayedRoomCurtain(roomCurtain);
		}, 500);

		return () => clearTimeout(timeout);
	}, [roomCurtain]);

	function findTypeAndNumber(arr, index) {
		let cumulativeLength = 0;
		for (let i = 0; i < arr.length; i++) {
			const currentLength = arr[i].length;
			if (index <= cumulativeLength + currentLength - 1) {
				const number = index - cumulativeLength;
				return { type: i, number };
			}
			cumulativeLength += currentLength;
		}
		return { type: 0, number: 0 };
	}

	const { type, number } = useMemo(
		() => findTypeAndNumber(levelData, playerPositionRoom),
		[playerPositionRoom]
	);

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
			calculatedPosition = [3.4, 1.13, 13.74];
		} else if (camera.position.x > 8) {
			calculatedPosition = [14.5, -0.07, 15];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomCount, camera, isTutorialOpen]);

	const handleDetection = useCallback(() => {
		if (camera.position.x > 1.8 && camera.position.z > 3) {
			if (roomCurtain && tutorialObjectives[2] === false) {
				setCursor('clean-window');
				setIsDetected(true);
				progressConditionsRef.current = {
					isDetected: true,
					delayedRoomCurtain: roomCurtain,
					type,
					number,
				};
			}
		} else if (!objective && roomCurtain) {
			setCursor('clean-window');
			setIsDetected(true);
			progressConditionsRef.current = {
				isDetected: true,
				delayedRoomCurtain: roomCurtain,
				type,
				number,
			};
		}
	}, [
		setCursor,
		camera,
		roomCurtain,
		objective,
		tutorialObjectives,
		delayedRoomCurtain,
		type,
		number,
	]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	useEffect(() => {
		const handleProgressComplete = () => {
			const savedConditions = progressConditionsRef.current;
			const currentCursor = useInterface.getState().cursor;

			if (savedConditions && currentCursor === 'clean-window') {
				if (
					savedConditions.isDetected &&
					savedConditions.delayedRoomCurtain &&
					!(savedConditions.type === 3 && savedConditions.number === 0)
				) {
					setCursor(null);

					Object.values(actions).forEach((action) => {
						if (!action.isRunning()) {
							if (action && action.time !== action.getClip().duration) {
								action.clampWhenFinished = true;
								action.timeScale = 2;
								action.loop = THREE.LoopOnce;
								action.repetitions = 1;

								if (windowSoundRef.current) {
									windowSoundRef.current.play();
								}

								action.play();
								if (
									tutorialObjectives[2] === false &&
									!recentlyChangedObjectives[2]
								) {
									setTutorialObjectives([
										tutorialObjectives[0],
										tutorialObjectives[1],
										true,
									]);
								} else {
									setInterfaceObjectives(2, roomNumber);
									const currentRoom = Object.values(
										useGame.getState().seedData
									)[roomNumber];
									if (currentRoom?.hideObjective === 'window') {
										useGame
											.getState()
											.checkObjectiveCompletion('window', roomNumber, camera);
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
		isDetected,
		delayedRoomCurtain,
		type,
		number,
		actions,
		setInterfaceObjectives,
		roomNumber,
		tutorialObjectives,
		recentlyChangedObjectives,
		setTutorialObjectives,
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
							action.timeScale = 2;
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
				position={[1, 0, 0]}
				scale={[1.2, 1.8, 0.2]}
				distance={3}
				onDetect={handleDetection}
				onDetectEnd={handleDetectionEnd}
				key={roomCurtain}
				type="clean"
				name="window"
			/>
			<group name="Scene">
				<mesh
					name="frame"
					castShadow
					receiveShadow
					geometry={nodes.frame.geometry}
				>
					<meshStandardMaterial color="white" attach="material" />
					<mesh
						name="frame001"
						castShadow
						receiveShadow
						geometry={nodes.frame001.geometry}
						position={[0.985, 0.045, -0.051]}
					>
						<meshStandardMaterial color="lightgrey" attach="material" />
					</mesh>
				</mesh>
				<mesh
					name="right"
					castShadow
					receiveShadow
					geometry={nodes.right.geometry}
				>
					<meshPhysicalMaterial
						transparent
						polygonOffset
						opacity={0.6}
						polygonOffsetFactor={-1}
						roughness={0.01}
						metalness={1}
						color="white"
						attach="material"
					/>
				</mesh>

				<mesh
					name="left"
					castShadow
					receiveShadow
					geometry={nodes.left.geometry}
					material={nodes.left.material}
					position={[-0.417, -1.128, -5.799]}
				>
					<meshPhysicalMaterial
						transparent
						polygonOffset
						opacity={0.6}
						polygonOffsetFactor={-1}
						roughness={0.01}
						metalness={1}
						color="white"
						attach="material"
					/>
				</mesh>
				<mesh
					name="cage"
					castShadow
					receiveShadow
					geometry={nodes.cage.geometry}
				>
					<meshStandardMaterial
						color="#303030"
						metalness={0.9}
						roughness={0.5}
						envMapIntensity={1.5}
						attach="material"
					/>
				</mesh>
			</group>
			<PositionalAudio ref={windowSoundRef} {...windowSound} loop={false} />
		</group>
	);
}
