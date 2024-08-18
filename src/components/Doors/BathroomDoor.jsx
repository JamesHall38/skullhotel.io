import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';

export default function BathroomDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const { nodes, materials } = useGLTF('/models/doors/bathroomDoor.glb');
	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const setBathroomsDoors = useDoor((state) => state.setBathroomDoors);
	const isOpen = useDoor((state) => state.bathroomDoor);
	const setOpen = useDoor((state) => state.setBathroomDoor);
	const [instantChange, setInstantChange] = useState(false);

	useEffect(() => {
		if (bathroomDoors[roomNumber] === true && !isOpen) {
			setInstantChange(true);
			setOpen(true);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		} else if (bathroomDoors[roomNumber] === false && isOpen) {
			setInstantChange(true);
			setOpen(false);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		}
	}, [bathroomDoors, roomNumber, setOpen, isOpen]);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[7.28, 0.99, 4.18]}
			isOpen={isOpen}
			setOpen={(value) => {
				setBathroomsDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomTotal / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
		>
			<group>
				<mesh
					geometry={nodes.Cube004.geometry}
					material={materials.MediumWood}
				/>
				<mesh
					geometry={nodes.Cube004_1.geometry}
					material={materials['Metal.001']}
				/>
			</group>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/bathroomDoor.glb');
