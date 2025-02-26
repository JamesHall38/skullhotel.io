import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import * as THREE from 'three';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

const tutorialRoomCenter = [4.53, 1.11, 5.78];
const doorOffset = [7.31, 1.11, 4.08];

const BathroomDoorMesh = ({ isHandlePressed }) => {
	const { nodes, materials } = useGLTF('/models/doors/bathroom_door.glb');
	const handleRef = useRef();
	const handleRotationRef = useRef(0);

	const bathroomDoorParts = useMemo(
		() => [
			{ name: 'frame', label: 'Door frame' },
			{ name: 'door', label: 'Door' },
			{ name: 'handle', label: 'Door handle' },
		],
		[]
	);

	const { loadedItems } = useProgressiveLoad(bathroomDoorParts, 'BathroomDoor');

	const visibleParts = useMemo(() => {
		return bathroomDoorParts.reduce((acc, part) => {
			acc[part.name] = loadedItems.some((item) => item.name === part.name);
			return acc;
		}, {});
	}, [loadedItems, bathroomDoorParts]);

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
			{visibleParts.frame && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube050.geometry}
					material={materials['metal.011']}
				/>
			)}
			{visibleParts.door && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube050_1.geometry}
					material={materials['wood.005']}
				/>
			)}
			{visibleParts.handle && (
				<mesh
					ref={handleRef}
					castShadow
					receiveShadow
					geometry={nodes.Handle.geometry}
					material={materials['metal.011']}
					position={[0, 0.09, -0.76]}
				/>
			)}
		</group>
	);
};

export default function BathroomDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const setBathroomsDoors = useDoor((state) => state.setBathroomDoors);
	const isOpen = useDoor((state) => state.bathroomDoor);
	const setOpen = useDoor((state) => state.setBathroomDoor);
	const isHandlePressed = useDoor((state) => state.bathroomDoorHandle);
	const setHandlePressed = useDoor((state) => state.setBathroomDoorHandle);
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
			offset={doorOffset}
			isOpen={isOpen}
			setHandlePressed={setHandlePressed}
			setOpen={(value) => {
				setBathroomsDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomCount / 2}
			doubleRotate={true}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			tutorialRoomOffset={tutorialRoomCenter}
			closet
		>
			<BathroomDoorMesh isHandlePressed={isHandlePressed} />
		</DoorWrapper>
	);
}
