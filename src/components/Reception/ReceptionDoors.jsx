import React, { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import DoorWrapper from '../Doors/DoorWrapper';
import * as THREE from 'three';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import WoodMaterial from '../materials/WoodMaterial';

const Door = ({ isHandlePressed }) => {
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	const handleRef = useRef();
	const handleRotationRef = useRef(0);
	const woodMaterial = WoodMaterial();
	const lockMaterial = useMemo(
		() => new THREE.MeshBasicMaterial({ color: '#ff0000' }),
		[]
	);

	useFrame((_, delta) => {
		if (!handleRef.current) return;

		const targetRotation = isHandlePressed ? -Math.PI / 4 : 0;
		handleRotationRef.current = THREE.MathUtils.lerp(
			handleRotationRef.current,
			targetRotation,
			delta * 15
		);
		handleRef.current.rotation.z = handleRotationRef.current;
	});

	return (
		<group>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003_4.geometry}
				material={woodMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Lock.geometry}
				material={lockMaterial}
			/>
			<mesh
				castShadow
				receiveShadow
				ref={handleRef}
				geometry={nodes.Handles.geometry}
				position={[-1.128, 0.105, 0]}
				material={materials.Handle}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003.geometry}
				material={materials.Frame}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003_1.geometry}
				material={materials.Handle}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003_2.geometry}
				material={materials.Metal}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Lock.geometry}
				material={materials.Lock}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003_5.geometry}
				material={materials.Plastic}
			/>
		</group>
	);
};

export default function ReceptionDoors() {
	const tutorialDoor = useDoor((state) => state.tutorial);
	const setTutorialDoor = useDoor((state) => state.setTutorial);
	const tutorialHandle = useDoor((state) => state.tutorialHandle);
	const setTutorialHandle = useDoor((state) => state.setTutorialHandle);

	const exitDoor = useDoor((state) => state.exit);
	const exitHandle = useDoor((state) => state.exitHandle);
	const setExitHandle = useDoor((state) => state.setExitHandle);

	const corridorDoor = useDoor((state) => state.corridor);
	const setCorridorDoor = useDoor((state) => state.setCorridor);
	const corridorHandle = useDoor((state) => state.corridorHandle);
	const setCorridorHandle = useDoor((state) => state.setCorridorHandle);

	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);
	const setIsTutorialOpen = useGame((state) => state.setIsTutorialOpen);
	const setEndAnimationPlaying = useGame(
		(state) => state.setEndAnimationPlaying
	);
	const roomCount = useGameplaySettings((state) => state.roomCount);

	const currentDialogueIndex = useInterface(
		(state) => state.currentDialogueIndex
	);
	const setCurrentDialogueIndex = useInterface(
		(state) => state.setCurrentDialogueIndex
	);
	const isTutorialCompleted = useInterface(
		(state) => state.isTutorialCompleted
	);
	const objectives = useInterface((state) => state.interfaceObjectives);
	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	useEffect(() => {
		if (tutorialDoor) {
			setIsTutorialOpen(true);
		} else if (corridorDoor) {
			setIsTutorialOpen(false);
		}
	}, [tutorialDoor, corridorDoor, setIsTutorialOpen]);

	const initialPosition = 0.5;

	return (
		<group>
			<DoorWrapper
				offset={[3.9, 0.965, 0.66]}
				rotate
				isOpen={corridorDoor}
				setHandlePressed={setCorridorHandle}
				setOpen={(value) => {
					if (isTutorialCompleted || window.location.hash.includes('#debug')) {
						setCorridorDoor(value);
						setPlayerPositionRoom(initialPosition);
					} else {
						if (currentDialogueIndex !== 0) {
							setCurrentDialogueIndex(0);
							setTimeout(() => setCurrentDialogueIndex(null), 3000);
						}
					}
				}}
				doubleRotate
				isReceptionDoor={true}
			>
				<Door isHandlePressed={corridorHandle} />
			</DoorWrapper>
			<group>
				<DoorWrapper
					offset={[6.582, 0.965, 3.2]}
					isOpen={tutorialDoor}
					setHandlePressed={setTutorialHandle}
					setOpen={(value) => {
						setTutorialDoor(value);
						setPlayerPositionRoom(initialPosition);
					}}
				>
					<Door isHandlePressed={tutorialHandle} />
				</DoorWrapper>
				<DoorWrapper
					offset={[10.025, 0.965, -3.85]}
					isOpen={exitDoor}
					setHandlePressed={setExitHandle}
					setOpen={() => {
						if (doneObjectives >= roomCount / 2) {
							setEndAnimationPlaying(true);
						} else {
							if (currentDialogueIndex !== 0) {
								setCurrentDialogueIndex(0);
								setTimeout(() => setCurrentDialogueIndex(null), 3000);
							}
						}
					}}
				>
					<Door isHandlePressed={exitHandle} />
				</DoorWrapper>
			</group>
		</group>
	);
}

useGLTF.preload('/models/doors/door.glb');
