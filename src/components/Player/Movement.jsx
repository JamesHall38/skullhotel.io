import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';
import useMonster from '../../hooks/useMonster';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useDoorStore from '../../hooks/useDoor';

const WALK_SPEED = 1;
const RUN_SPEED = 2;
const CROUCH_SPEED = 1;
const CROUCH_CAMERA_OFFSET = 0.8;
const RAISED_AREA_LOW_HEIGHT = 0.5;
const RAISED_AREA_HIGH_HEIGHT = 0.7;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const floor = -0.2;

const GRID_OFFSET_X = 600;
const GRID_OFFSET_Z = 150;

export default function Movement({
	playerPosition,
	playerVelocity,
	isCrouchingRef,
	isRunning,
	crouchProgressRef,
}) {
	const playerPositionRoom = useGame((state) => state.realPlayerPositionRoom);
	const monsterState = useMonster((state) => state.monsterState);
	const getCell = useGridStore((state) => state.getCell);
	const getKeys = useKeyboardControls()[1];
	const getGamepadControls = useGamepadControls();

	const leftStickRef = useRef({ x: 0, y: 0 });
	const rightStickRef = useRef({ x: 0, y: 0 });

	useJoysticksStore.setState({
		leftStickRef,
		rightStickRef,
	});

	const [isInsideDoor, setIsInsideDoor] = useState(false);

	const roomDoor = useDoorStore((state) => state.roomDoor);
	const bathroomDoor = useDoorStore((state) => state.bathroomDoor);
	const roomCurtain = useDoorStore((state) => state.roomCurtain);
	const bathroomCurtain = useDoorStore((state) => state.bathroomCurtain);
	const desk = useDoorStore((state) => state.desk);
	const nightStand = useDoorStore((state) => state.nightStand);
	const exit = useDoorStore((state) => state.exit);
	const tutorial = useDoorStore((state) => state.tutorial);
	const corridor = useDoorStore((state) => state.corridor);

	useEffect(() => {
		const cellX = Math.floor(playerPosition.current.x * 10 + GRID_OFFSET_X);
		const cellZ = Math.floor(playerPosition.current.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);

		if (
			(cell.type === CELL_TYPES.ROOM_DOOR_OPEN &&
				roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN && bathroomDoor) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN && bathroomDoor) ||
			(cell.type === CELL_TYPES.ROOM_CURTAIN_CLOSED && !roomCurtain) ||
			(cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED && !bathroomCurtain) ||
			(cell.type === CELL_TYPES.ROOM_DOOR_CLOSED && !roomDoor) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_CLOSED && !bathroomDoor) ||
			(cell.type === CELL_TYPES.TUTORIAL_DOOR_OPEN && tutorial) ||
			(cell.type === CELL_TYPES.CORRIDOR_DOOR_OPEN && corridor) ||
			(cell.type === CELL_TYPES.EXIT_DOOR_OPEN && exit)
		) {
			setIsInsideDoor(true);
		}
	}, [
		roomDoor,
		bathroomDoor,
		desk,
		nightStand,
		roomCurtain,
		bathroomCurtain,
		tutorial,
		corridor,
		exit,
		playerPosition,
		getCell,
		playerPositionRoom,
	]);

	const checkCollision = (pos) => {
		const cellX = Math.floor(pos.x * 10 + GRID_OFFSET_X);
		const cellZ = Math.floor(pos.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);

		if (cell.type === CELL_TYPES.WALL) {
			return true;
		}

		if (isInsideDoor) {
			if (cell.type === CELL_TYPES.EMPTY) {
				setIsInsideDoor(false);
			}
			return false;
		}

		if (
			(cell.type === CELL_TYPES.ROOM_DOOR_OPEN &&
				roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN && bathroomDoor) ||
			(cell.type === CELL_TYPES.TUTORIAL_DOOR_OPEN && tutorial) ||
			(cell.type === CELL_TYPES.CORRIDOR_DOOR_OPEN && corridor) ||
			(cell.type === CELL_TYPES.EXIT_DOOR_OPEN && exit)
		) {
			return true;
		}

		if (
			(cell.type === CELL_TYPES.ROOM_DOOR_CLOSED &&
				!roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_CLOSED && !bathroomDoor) ||
			(cell.type === CELL_TYPES.ROOM_CURTAIN_CLOSED && !roomCurtain) ||
			(cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED && !bathroomCurtain) ||
			(cell.type === CELL_TYPES.DESK_DOOR_CLOSED && !desk) ||
			(cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED && !nightStand) ||
			(cell.type === CELL_TYPES.EXIT_DOOR_CLOSED && !exit) ||
			(cell.type === CELL_TYPES.TUTORIAL_DOOR_CLOSED && !tutorial) ||
			(cell.type === CELL_TYPES.CORRIDOR_DOOR_CLOSED && !corridor)
		) {
			return true;
		}

		if (
			((cell.type === CELL_TYPES.RAISED_AREA_LOW ||
				cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED) &&
				pos.y < floor + RAISED_AREA_LOW_HEIGHT) ||
			((cell.type === CELL_TYPES.RAISED_AREA_HIGH ||
				cell.type === CELL_TYPES.BED) &&
				pos.y < floor + RAISED_AREA_HIGH_HEIGHT)
		) {
			return true;
		}

		if (
			(cell.type === CELL_TYPES.CROUCH_ONLY ||
				cell.type === CELL_TYPES.DESK_DOOR_CLOSED ||
				cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED) &&
			!isCrouchingRef.current
		) {
			return true;
		}

		return false;
	};

	useFrame((state, delta) => {
		if (monsterState === 'run') {
			return;
		}

		const {
			forward: keyForward,
			backward: keyBackward,
			left: keyLeft,
			right: keyRight,
		} = getKeys();
		const gamepadControls = getGamepadControls();

		const leftStick = leftStickRef.current;
		// const rightStick = rightStickRef.current;

		let forward = keyForward || gamepadControls.forward;
		let backward = keyBackward || gamepadControls.backward;
		let left = keyLeft || gamepadControls.left;
		let right = keyRight || gamepadControls.right;

		if (Math.abs(leftStick.y) > 0.1) {
			forward = leftStick.y < 0;
			backward = leftStick.y > 0;
		}

		if (Math.abs(leftStick.x) > 0.1) {
			left = leftStick.x < 0;
			right = leftStick.x > 0;
		}

		frontVector.set(0, 0, Number(forward) - Number(backward));
		sideVector.set(Number(right) - Number(left), 0, 0);

		const cameraQuaternion = state.camera.quaternion.clone();
		const movementDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			cameraQuaternion
		);
		movementDirection.y = 0;
		movementDirection.normalize();

		const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
			cameraQuaternion
		);
		cameraRight.y = 0;
		cameraRight.normalize();

		direction.set(0, 0, 0);
		direction.addScaledVector(movementDirection, frontVector.z);
		direction.addScaledVector(cameraRight, sideVector.x);
		direction
			.normalize()
			.multiplyScalar(
				isRunning
					? RUN_SPEED
					: isCrouchingRef.current
					? CROUCH_SPEED
					: WALK_SPEED
			);

		playerVelocity.current.copy(direction);

		const newPosition = playerPosition.current
			.clone()
			.add(playerVelocity.current.clone().multiplyScalar(delta));

		state.camera.position.copy(playerPosition.current);
		state.camera.position.y += 1.7;

		if (
			!checkCollision(
				new THREE.Vector3(
					newPosition.x,
					playerPosition.current.y,
					playerPosition.current.z
				)
			)
		) {
			playerPosition.current.x = newPosition.x;
		}

		if (
			!checkCollision(
				new THREE.Vector3(
					playerPosition.current.x,
					playerPosition.current.y,
					newPosition.z
				)
			)
		) {
			playerPosition.current.z = newPosition.z;
		}

		// state.camera.position.copy(playerPosition.current);
		state.camera.position.x = playerPosition.current.x;
		state.camera.position.z = playerPosition.current.z;
		const standingHeight = 1.7;
		const crouchHeight = CROUCH_CAMERA_OFFSET;
		state.camera.position.y =
			playerPosition.current.y +
			standingHeight -
			(standingHeight - crouchHeight) * crouchProgressRef.current;

		if (monsterState === 'run') {
			playerVelocity.current.x = 0;
			playerVelocity.current.z = 0;
		}
	});
}
