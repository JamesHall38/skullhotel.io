import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations, PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';
import DetectionZone from '../DetectionZone';

const CORRIDORLENGTH = 5.95;
const offset = [9.53, 0.83, 1.6];

export default function Bottles() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
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

	const bottleSoundRef = useRef();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDelayedBathroomCurtain(bathroomCurtain);
		}, 500);

		return () => clearTimeout(timeout);
	}, [bathroomCurtain]);

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
			calculatedPosition = [2.32, 0 + offset[1], 3.28];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

	const handleDetection = useCallback(() => {
		if (!tutorialObjectives.every((value) => value === true)) {
			if (Math.abs(camera.position.z) > 0.4 && bathroomCurtain) {
				setCursor('clean');

				setIsDetected(true);
			}
		} else {
			if (Math.abs(camera.position.z) > 0.4 && bathroomCurtain && !objective) {
				setCursor('clean');

				setIsDetected(true);
			}
		}
	}, [setCursor, camera, bathroomCurtain, objective, tutorialObjectives]);

	const handleDetectionEnd = useCallback(() => {
		if (Math.abs(camera.position.z) > 0.4 && bathroomCurtain) {
			setCursor(null);
			setIsDetected(false);
		}
	}, [setCursor, camera, bathroomCurtain]);

	useEffect(() => {
		const onClick = () => {
			if (isDetected && delayedBathroomCurtain) {
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
							if (!tutorialObjectives.every((value) => value === true)) {
								setTutorialObjectives([
									true,
									tutorialObjectives[1],
									tutorialObjectives[2],
								]);
							} else {
								setInterfaceObjectives(0, roomNumber);
							}
						}
					}
				});
			}
		};
		document.addEventListener('click', onClick);

		return () => {
			document.removeEventListener('click', onClick);
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
	]);

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			Object.values(actions).forEach((action) => {
				if (action) {
					action.stop();
					action.reset();
				}
			});
		} else {
			isInit.current = true;
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
				url="/sounds/bottles.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</group>
	);
}

useGLTF.preload('/models/objectives/bottles.glb');
