import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';

const tutorialRoomCenter = [4.53, 1.11, 5.78];
const doorOffset = [7.31, 1.11, 4.08];

export default function BathroomDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const { nodes, materials } = useGLTF('/models/doors/bathroom_door.glb');
	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const setBathroomsDoors = useDoor((state) => state.setBathroomDoors);
	const isOpen = useDoor((state) => state.bathroomDoor);
	const setOpen = useDoor((state) => state.setBathroomDoor);
	const [instantChange, setInstantChange] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setCursor = useInterface((state) => state.setCursor);
	const [tutorialRoomOffset, setTutorialRoomOffset] = useState(null);
	const { camera } = useThree();

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
			offset={doorOffset}
			isOpen={isOpen}
			setOpen={(value) => {
				setBathroomsDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomTotal / 2}
			doubleRotate={true}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			tutorialRoomOffset={tutorialRoomOffset}
			closet
		>
			<group>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube050.geometry}
					material={materials['metal.011']}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube050_1.geometry}
					material={materials['wood.005']}
					onPointerOut={() => setCursor(null)}
				/>
			</group>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/bathroom_door.glb');
