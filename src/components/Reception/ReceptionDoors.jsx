import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from '../Doors/DoorWrapper';
import * as THREE from 'three';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';

const Door = () => {
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	return (
		<group>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Lock.geometry}
				material={new THREE.MeshBasicMaterial({ color: '#ff0000' })}
			/>

			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Handles.geometry}
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
				geometry={nodes.Cube003_3.geometry}
				material={materials.Lock}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube003_4.geometry}
				material={materials.Wood}
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
	const exitDoor = useDoor((state) => state.exit);
	const setExitDoor = useDoor((state) => state.setExit);
	const corridorDoor = useDoor((state) => state.corridor);
	const setCorridorDoor = useDoor((state) => state.setCorridor);
	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);
	const isMobile = useGame((state) => state.isMobile);
	const currentDialogueIndex = useInterface(
		(state) => state.currentDialogueIndex
	);
	const setCurrentDialogueIndex = useInterface(
		(state) => state.setCurrentDialogueIndex
	);
	const objectives = useInterface((state) => state.interfaceObjectives);
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	return (
		<group>
			<DoorWrapper
				offset={[3.9, 0.965, 0.66]}
				rotate
				isOpen={corridorDoor}
				setOpen={(value) => {
					if (isMobile) {
						if (doneObjectives === 10) {
							setCorridorDoor(value);
						} else {
							if (currentDialogueIndex !== 0) {
								setCurrentDialogueIndex(0);
								setTimeout(() => setCurrentDialogueIndex(null), 3000);
							}
						}
					} else {
						if (tutorialObjectives.every((value) => value === true)) {
							setCorridorDoor(value);
							setPlayerPositionRoom(Math.random());
						} else {
							if (currentDialogueIndex !== 0) {
								setCurrentDialogueIndex(0);
								setTimeout(() => setCurrentDialogueIndex(null), 3000);
							}
						}
					}
				}}
				doubleRotate
			>
				<Door />
			</DoorWrapper>
			{!isMobile && (
				<group>
					<DoorWrapper
						offset={[6.582, 0.965, 3.2]}
						isOpen={tutorialDoor}
						setOpen={(value) => {
							setTutorialDoor(value);
							setPlayerPositionRoom(Math.random());
						}}
					>
						<Door />
					</DoorWrapper>
					<DoorWrapper
						offset={[10.025, 0.965, -3.85]}
						isOpen={exitDoor}
						setOpen={(value) => {
							if (doneObjectives === 10) {
								setExitDoor(value);
							} else {
								if (currentDialogueIndex !== 0) {
									setCurrentDialogueIndex(0);
									setTimeout(() => setCurrentDialogueIndex(null), 3000);
								}
							}
						}}
					>
						<Door />
					</DoorWrapper>
				</group>
			)}
		</group>
	);
}

useGLTF.preload('/models/doors/door.glb');
