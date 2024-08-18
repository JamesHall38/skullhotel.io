import React from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from '../Doors/DoorWrapper';
import * as THREE from 'three';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';

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
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	const tutorialDoor = useDoor((state) => state.tutorial);
	const setTutorialDoor = useDoor((state) => state.setTutorial);
	const exitDoor = useDoor((state) => state.exit);
	const setExitDoor = useDoor((state) => state.setExit);
	const corridorDoor = useDoor((state) => state.corridor);
	const setCorridorDoor = useDoor((state) => state.setCorridor);
	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);

	return (
		<group>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={materials.Frame}
				position={[3.9, 1, 0.645]}
			/>
			<DoorWrapper
				offset={[3.9, 1, 0.645]}
				rotate
				isOpen={corridorDoor}
				setOpen={(value) => {
					setCorridorDoor(value);
					setPlayerPositionRoom(Math.random());
				}}
			>
				<Door />
			</DoorWrapper>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={materials.Frame}
				position={[6.5, 1, 2]}
			/>
			<DoorWrapper
				offset={[6.5, 1, 2]}
				isOpen={tutorialDoor}
				setOpen={(value) => {
					setTutorialDoor(value);
					setPlayerPositionRoom(Math.random());
				}}
			>
				<Door />
			</DoorWrapper>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={materials.Frame}
				position={[10.025 + 1.33, 1, -3.85]}
			/>
			<DoorWrapper
				offset={[10.025, 1, -3.85]}
				isOpen={exitDoor}
				setOpen={(value) => setExitDoor(value)}
			>
				<Door />
			</DoorWrapper>
		</group>
	);
}

useGLTF.preload('/models/doors/door.glb');
