import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import * as THREE from 'three';
import DetectionZone from '../DetectionZone';
import FabricMaterial from '../FabricMaterial';

const CORRIDORLENGTH = 5.95;
const offset = [8.833, 0.014, 6.2];

export default function Bedsheets() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const setCursor = useInterface((state) => state.setCursor);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
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
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[1]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const { camera } = useThree();

	const bedsheetsSoundRef = useRef();

	const animationMeshClone = useMemo(() => {
		return nodes.Animated.clone();
	}, [nodes]);

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomTotal / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH,
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

		if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		} else if (camera.position.x <= 8 && camera.position.x > 4.4) {
			calculatedPosition = [3.02, 0.02, 7.9];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

	useEffect(() => {
		const handleInteraction = () => {
			if (isDetected) {
				const mixer = new THREE.AnimationMixer(animationMeshClone);
				animations.forEach((clip) => {
					if (clip.name === 'Bedsheets') {
						const action = mixer.clipAction(clip);
						action.clampWhenFinished = true;
						action.timeScale = 1;
						action.loop = THREE.LoopOnce;
						action.repetitions = 1;
						// action.time = 1.25;
						action.time = 0;
						action.play();
					}
				});
				mixerRef.current = mixer;
				if (visibleMesh === 'Start') {
					setVisibleMesh('Animated');

					if (bedsheetsSoundRef.current) {
						bedsheetsSoundRef.current.play();
					}

					setTimeout(() => {
						if (tutorialObjectives[1] === false) {
							setTutorialObjectives([
								tutorialObjectives[0],
								true,
								tutorialObjectives[2],
							]);
						} else {
							setInterfaceObjectives(1, roomNumber);
						}
					}, 1000);
				}
			}
		};

		document.addEventListener('click', handleInteraction);
		return () => document.removeEventListener('click', handleInteraction);
	}, [
		animations,
		animationMeshClone,
		visibleMesh,
		camera,
		roomNumber,
		tutorialObjectives,
		setTutorialObjectives,
		setInterfaceObjectives,
		isDetected,
	]);

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			setVisibleMesh('Start');
			mixerRef.current.stopAllAction();
			mixerRef.current.setTime(0);
		} else {
			isInit.current = true;
			if (objective) {
				setVisibleMesh('End');
			}
		}
	}, [objective, roomNumber]);

	// const tutorialInit = useRef(false);

	// useEffect(() => {
	// 	if (tutorialObjectives[1] === false && tutorialInit.current === true) {
	// 		setVisibleMesh('Start');
	// 		mixerRef.current.stopAllAction();
	// 		mixerRef.current.setTime(1);
	// 	} else {
	// 		tutorialInit.current = true;
	// 		if (tutorialObjectives[1] === true) {
	// 			setVisibleMesh('End');
	// 		}
	// 	}
	// }, [tutorialObjectives, roomNumber]);

	useFrame((_, delta) => {
		if (mixerRef.current) {
			mixerRef.current.update(delta);
			if (visibleMesh === 'Animated') {
				const action = mixerRef.current.existingAction(
					animations.find((a) => a.name === 'Bedsheets')
				);
				if (action && action.time === action.getClip().duration) {
					setVisibleMesh('End');
				}
			}
		}
	});

	const handleDetection = useCallback(() => {
		if (!objective) {
			setCursor('clean');
		}
		if (tutorialObjectives[1] === false) {
			setCursor('clean');
		}
		setIsDetected(true);
	}, [setCursor, objective, tutorialObjectives]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

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
			/>

			<group scale={0.96} name="Scene">
				<mesh
					visible={visibleMesh === 'End'}
					name="End"
					geometry={nodes.End.geometry}
					material={material}
				/>
				<mesh
					visible={visibleMesh === 'Start'}
					name="Start"
					geometry={nodes.Start.geometry}
					material={material}
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
				url="/sounds/bedsheets.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</group>
	);
}

useGLTF.preload('/models/objectives/bedsheets.glb');
