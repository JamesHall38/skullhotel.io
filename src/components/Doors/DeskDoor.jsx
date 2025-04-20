import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import useHiding from '../../hooks/useHiding';
import DoorWrapper from './DoorWrapper';
import { useThree } from '@react-three/fiber';
import WoodMaterial from '../materials/WoodMaterial';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useGameplaySettings from '../../hooks/useGameplaySettings';

const tutorialRoomCenter = [6.69, 0.41, 8.52];
const doorOffset = [5.15, 0.41, 6.82];

const GRID_OFFSET_Z = 150;

export default function DeskDoor() {
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const deskDoors = useDoor((state) => state.desks);
	const setDeskDoors = useDoor((state) => state.setDesks);
	const { nodes } = useGLTF('/models/doors/desk_door.glb');
	const isOpen = useDoor((state) => state.desk);
	const setOpen = useDoor((state) => state.setDesk);
	const [instantChange, setInstantChange] = useState(false);
	const createWoodMaterial = WoodMaterial();
	const doorMaterial = useRef(createWoodMaterial());
	const { camera } = useThree();
	const getCell = useGridStore((state) => state.getCell);
	const isHidden = useHiding(
		(state) => state.isPlayerHidden && state.hideSpot === 'desk'
	);
	const [gridOffsetX, setGridOffsetX] = useState(0);

	const { opacity } = useSpring({
		opacity: isHidden ? 0.05 : 1,
		config: {
			mass: 1,
			tension: 170,
			friction: 26,
		},
	});

	useEffect(() => {
		setGridOffsetX(roomCount * 29.5 + 10);
	}, [roomCount]);

	useEffect(() => {
		if (deskDoors[playerPositionRoom] === true && !isOpen) {
			setInstantChange(true);
			setOpen(true);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		} else if (deskDoors[playerPositionRoom] === false && isOpen) {
			setInstantChange(true);
			setOpen(false);
			setTimeout(() => {
				setInstantChange(false);
			}, 100);
		}
	}, [deskDoors, playerPositionRoom, setOpen, isOpen]);

	useEffect(() => {
		const cellX = Math.floor(camera.position.x * 10 + gridOffsetX);
		const cellZ = Math.floor(camera.position.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);

		if (cell.type === CELL_TYPES.DESK_DOOR_CLOSED && !isOpen) {
			setTimeout(() => {
				setDeskDoors(playerPositionRoom, true);
				setOpen(true);
			}, 200);
		}
	}, [
		camera.position,
		isOpen,
		playerPositionRoom,
		setDeskDoors,
		setOpen,
		getCell,
		gridOffsetX,
	]);

	useEffect(() => {
		doorMaterial.current.transparent = true;
	}, [doorMaterial]);

	return (
		<DoorWrapper
			roomNumber={playerPositionRoom}
			offset={doorOffset}
			isOpen={isOpen}
			setOpen={(value) => {
				setDeskDoors(playerPositionRoom, value);
				setOpen(value);
			}}
			rotate={playerPositionRoom >= roomCount / 2}
			instantChange={instantChange}
			setInstantChange={setInstantChange}
			closet
			tutorialRoomOffset={tutorialRoomCenter}
		>
			<group dispose={null}>
				<a.mesh
					castShadow
					receiveShadow
					geometry={nodes.Desk.geometry}
					material={doorMaterial.current}
					material-opacity={opacity}
				/>
				<a.mesh castShadow receiveShadow geometry={nodes.handle.geometry}>
					<meshStandardMaterial color="grey" metalness={1} roughness={0.5} />
				</a.mesh>
			</group>
		</DoorWrapper>
	);
}
