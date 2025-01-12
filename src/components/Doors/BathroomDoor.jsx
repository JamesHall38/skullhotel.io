import { useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

const tutorialRoomCenter = [4.53, 1.11, 5.78];
const doorOffset = [7.31, 1.11, 4.08];

const BathroomDoorMesh = ({ isHandlePressed }) => {
	const { nodes, materials } = useGLTF('/models/doors/bathroom_door.glb');
	const handleRef = useRef();
	const handleRotationRef = useRef(0);

	useFrame((_, delta) => {
		if (!handleRef.current) return;

		const targetRotation = isHandlePressed ? -Math.PI / 4 : 0;
		handleRotationRef.current = THREE.MathUtils.lerp(
			handleRotationRef.current,
			targetRotation,
			delta * 15
		);
		handleRef.current.rotation.x = handleRotationRef.current;
	});

	return (
		<group rotation={[Math.PI, -1.571, 0]}>
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
			/>
			<mesh
				ref={handleRef}
				castShadow
				receiveShadow
				geometry={nodes.Handle.geometry}
				material={materials['metal.011']}
				position={[0, 0.09, -0.76]}
			/>
		</group>
	);
};

export default function BathroomDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const setBathroomsDoors = useDoor((state) => state.setBathroomDoors);
	const isOpen = useDoor((state) => state.bathroomDoor);
	const setOpen = useDoor((state) => state.setBathroomDoor);
	const isHandlePressed = useDoor((state) => state.bathroomDoorHandle);
	const setHandlePressed = useDoor((state) => state.setBathroomDoorHandle);
	const [instantChange, setInstantChange] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
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
			isHandlePressed={isHandlePressed}
			setHandlePressed={setHandlePressed}
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
			<BathroomDoorMesh isHandlePressed={isHandlePressed} />
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/bathroom_door.glb');
