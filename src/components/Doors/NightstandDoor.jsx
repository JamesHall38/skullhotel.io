import React, { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';

export default function NightstandDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const nightstandDoors = useDoor((state) => state.nightStands);
	const setNightstandDoors = useDoor((state) => state.setNightStands);
	const { nodes, materials } = useGLTF('/models/doors/nightstandDoor.glb');
	const isOpen = useDoor((state) => state.nightStand);
	const setOpen = useDoor((state) => state.setNightStand);
	const [instantChange, setInstantChange] = useState(false);

	useEffect(() => {
		if (nightstandDoors[roomNumber] === true && !isOpen) {
			setInstantChange(true);
			setOpen(true);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		} else if (nightstandDoors[roomNumber] === false && isOpen) {
			setInstantChange(true);
			setOpen(false);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		}
	}, [nightstandDoors, roomNumber, setOpen, isOpen]);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[9.785, 0.51, 4.583]}
			isOpen={isOpen}
			setOpen={(value) => {
				setNightstandDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomTotal / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
		>
			<group dispose={null}>
				<mesh
					geometry={nodes.Mesh002.geometry}
					material={materials['Walnut Wood.001']}
					castShadow
					receiveShadow
				/>
				<mesh geometry={nodes.Mesh002_1.geometry} material={materials.GOLD} />
			</group>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/nightstandDoor.glb');
