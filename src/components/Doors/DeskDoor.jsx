import React, { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import DoorWrapper from './DoorWrapper';

export default function DeskDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const deskDoors = useDoor((state) => state.desks);
	const setDeskDoors = useDoor((state) => state.setDesks);
	const { nodes, materials } = useGLTF('/models/doors/deskDoor.glb');
	const isOpen = useDoor((state) => state.desk);
	const setOpen = useDoor((state) => state.setDesk);
	const [instantChange, setInstantChange] = useState(false);

	useEffect(() => {
		if (deskDoors[roomNumber] === true && !isOpen) {
			setInstantChange(true);
			setOpen(true);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		} else if (deskDoors[roomNumber] === false && isOpen) {
			setInstantChange(true);
			setOpen(false);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		}
	}, [deskDoors, roomNumber, setOpen, isOpen]);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[5.15, 0.41, 6.82]}
			isOpen={isOpen}
			setOpen={(value) => {
				setDeskDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomTotal / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
		>
			<group dispose={null}>
				<mesh
					geometry={nodes.Cube001.geometry}
					material={materials['Walnut Wood.001']}
					castShadow
					receiveShadow
				/>
				<mesh
					geometry={nodes.Cube001_1.geometry}
					material={materials['metal.001']}
				/>
			</group>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/deskDoor.glb');
