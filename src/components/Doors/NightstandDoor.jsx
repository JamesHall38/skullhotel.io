import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import DoorWrapper from './DoorWrapper';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import { useThree } from '@react-three/fiber';
import WoodMaterial from '../materials/WoodMaterial';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useHiding from '../../hooks/useHiding';
import { useSpring, a } from '@react-spring/three';
import useGameplaySettings from '../../hooks/useGameplaySettings';

const tutorialRoomCenter = [2.05, 0.51, 6.28];

const GRID_OFFSET_Z = 150;

export default function NightstandDoor() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const nightstandDoors = useDoor((state) => state.nightStands);
	const setNightstandDoors = useDoor((state) => state.setNightStands);
	const { nodes } = useGLTF('/models/doors/nightstand_door.glb');
	const createWoodMaterial = WoodMaterial();
	const doorMaterial = useRef(createWoodMaterial());
	const isOpen = useDoor((state) => state.nightStand);
	const setOpen = useDoor((state) => state.setNightStand);
	const [instantChange, setInstantChange] = useState(false);
	const { camera } = useThree();
	const getCell = useGridStore((state) => state.getCell);
	const isHidden = useHiding(
		(state) => state.isPlayerHidden && state.hideSpot === 'nightstand'
	);
	const [gridOffsetX, setGridOffsetX] = useState(0);
	const roomCount = useGameplaySettings((state) => state.roomCount);

	const { opacity } = useSpring({
		opacity: isHidden ? 0.05 : 1,
		config: {
			mass: 1,
			tension: 170,
			friction: 26,
		},
	});

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
		const cellX = Math.floor(camera.position.x * 10 + gridOffsetX);
		const cellZ = Math.floor(camera.position.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);

		if (cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED && !isOpen) {
			setTimeout(() => {
				setNightstandDoors(roomNumber, true);
				setOpen(true);
			}, 200);
		}
	}, [
		camera.position,
		isOpen,
		roomNumber,
		setNightstandDoors,
		setOpen,
		getCell,
		gridOffsetX,
	]);

	useEffect(() => {
		doorMaterial.current.transparent = true;
	}, [doorMaterial]);

	useEffect(() => {
		setGridOffsetX(roomCount * 29.5 + 10);
	}, [roomCount]);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[9.8, 0.51, 4.583]}
			isOpen={isOpen}
			setOpen={(value) => {
				setNightstandDoors(roomNumber, value);
				setOpen(value);
			}}
			rotate={roomNumber >= roomCount / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
			tutorialRoomOffset={tutorialRoomCenter}
			isNightstand={true}
		>
			<group dispose={null}>
				<a.mesh
					castShadow
					receiveShadow
					geometry={nodes.NightStand.geometry}
					material={doorMaterial.current}
					material-opacity={opacity}
				/>
				<a.mesh castShadow receiveShadow geometry={nodes.handle.geometry}>
					<meshStandardMaterial color="gold" metalness={1} roughness={0} />
				</a.mesh>
			</group>
		</DoorWrapper>
	);
}
