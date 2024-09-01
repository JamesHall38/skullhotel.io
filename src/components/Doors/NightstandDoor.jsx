import React, { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import { useThree } from '@react-three/fiber';

const tutorialRoomCenter = [2.05, 0.51, 6.28];

export default function NightstandDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const nightstandDoors = useDoor((state) => state.nightStands);
	const setNightstandDoors = useDoor((state) => state.setNightStands);
	const { nodes, materials } = useGLTF('/models/doors/nightstand_door.glb');
	const isOpen = useDoor((state) => state.nightStand);
	const setOpen = useDoor((state) => state.setNightStand);
	const [instantChange, setInstantChange] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const [tutorialRoomOffset, setTutorialRoomOffset] = useState(null);
	const { camera } = useThree();

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

	useEffect(() => {
		setTutorialRoomOffset(
			camera.position.x <= 8 && camera.position.x > 4.4
				? tutorialRoomCenter
				: null
		);
	}, [playerPositionRoom, camera]);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[9.8, 0.51, 4.583]}
			isOpen={isOpen}
			setOpen={(value) => {
				setNightstandDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomTotal / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
			tutorialRoomOffset={tutorialRoomOffset}
		>
			<group dispose={null}>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Mesh.geometry}
					material={materials.Wood}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Mesh_1.geometry}
					material={materials.GOLD}
				/>
			</group>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/nightstand_door.glb');
