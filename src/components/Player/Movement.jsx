import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useDoorStore from '../../hooks/useDoor';
import useGameplaySettings from '../../hooks/useGameplaySettings';

const WALK_SPEED = 0.75;
const RUN_SPEED = 1.25;
const MOBILE_SPEED = (WALK_SPEED + RUN_SPEED) / 2;
const CROUCH_SPEED = 0.4;
const CROUCH_CAMERA_OFFSET = 0.8;
const RAISED_AREA_LOW_HEIGHT = 0.5;
const RAISED_AREA_HIGH_HEIGHT = 0.7;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const floor = -0.2;

const GRID_OFFSET_Z = 150;

const LISTENING_SPEED_MULTIPLIER = 0;

export default function Movement({
	playerPosition,
	playerVelocity,
	isCrouchingRef,
	crouchProgressRef,
}) {
	const isMobile = useGame((state) => state.isMobile);
	const isCameraLocked = useGame((state) => state.isCameraLocked);
	const playerPositionRoom = useGame((state) => state.realPlayerPositionRoom);
	const jumpScare = useGame((state) => state.jumpScare);
	const isPlaying = useGame((state) => state.isPlaying);
	const setIsRunning = useGame((state) => state.setIsRunning);
	const isRunning = useGame((state) => state.isRunning);
	const isGameplayActive = useGame((state) => state.isGameplayActive);
	const getCell = useGridStore((state) => state.getCell);
	const getKeys = useKeyboardControls()[1];
	const gamepadControlsRef = useGamepadControls();

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

	const isListening = useGame((state) => state.isListening);
	const [listeningProgress, setListeningProgress] = useState(0);
	const introIsPlaying = useGame((state) => state.introIsPlaying);

	const [gridOffsetX, setGridOffsetX] = useState(0);
	const roomCount = useGameplaySettings((state) => state.roomCount);

	const [isRunningState, setIsRunningState] = useState(false);
	const [isGamepadRunning, setIsGamepadRunning] = useState(false);

	useEffect(() => {
		setGridOffsetX(roomCount * 29.5 + 10);
	}, [roomCount]);

	useEffect(() => {
		let interval;
		if (isListening) {
			interval = setInterval(() => {
				setListeningProgress((prev) => Math.min(1, prev + 0.1));
			}, 100);
		} else {
			interval = setInterval(() => {
				setListeningProgress((prev) => Math.max(0, prev - 0.1));
			}, 100);
		}
		return () => clearInterval(interval);
	}, [isListening]);

	useEffect(() => {
		const cellX = Math.floor(playerPosition.current.x * 10 + gridOffsetX);
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
		gridOffsetX,
	]);

	useEffect(() => {
		if (isMobile) return;

		const handleKeyDown = (event) => {
			if (event.shiftKey && !isCrouchingRef.current) {
				setIsRunningState(true);
				setIsRunning(true);
			}
		};

		const handleKeyUp = (event) => {
			if (event.key === 'Shift') {
				setIsRunningState(false);
				setIsRunning(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [isMobile, isCrouchingRef]);

	useFrame(() => {
		if (isMobile) return;

		const gamepadControls = gamepadControlsRef();

		if (gamepadControls.run && !isCrouchingRef.current) {
			setIsGamepadRunning(true);
			setIsRunning(true);
		}

		if (
			isGamepadRunning &&
			((Math.abs(leftStickRef.current.x) < 0.1 &&
				Math.abs(leftStickRef.current.y) < 0.1 &&
				!gamepadControls.forward &&
				!gamepadControls.backward &&
				!gamepadControls.left &&
				!gamepadControls.right) ||
				isCrouchingRef.current)
		) {
			setIsGamepadRunning(false);
			setIsRunning(false);
		}
	});

	const checkCollision = (pos) => {
		const cellX = Math.floor(pos.x * 10 + gridOffsetX);
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
		if (!isPlaying || isCameraLocked || jumpScare || introIsPlaying) {
			return;
		}

		const { forward, backward, left, right } = getKeys();
		const gamepadControls = gamepadControlsRef();

		frontVector.set(0, 0, 0);
		sideVector.set(0, 0, 0);

		if (isGameplayActive) {
			if (isMobile) {
				frontVector.z = -leftStickRef.current.y;
				sideVector.x = leftStickRef.current.x;
			} else {
				if (forward) frontVector.z += 1;
				if (backward) frontVector.z -= 1;
				if (left) sideVector.x -= 1;
				if (right) sideVector.x += 1;

				if (
					Math.abs(gamepadControls.leftStickX) > 0.1 ||
					Math.abs(gamepadControls.leftStickY) > 0.1
				) {
					frontVector.set(0, 0, -gamepadControls.leftStickY);
					sideVector.set(gamepadControls.leftStickX, 0, 0);
				}
			}
		}

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

		if (direction.length() > 1) {
			direction.normalize();
		}

		const isPlayerRunning = isRunning || isGamepadRunning;

		let baseSpeed = isMobile
			? MOBILE_SPEED
			: isCrouchingRef.current
			? CROUCH_SPEED
			: isPlayerRunning
			? RUN_SPEED
			: WALK_SPEED;

		direction.multiplyScalar(
			baseSpeed * (1 - listeningProgress * (1 - LISTENING_SPEED_MULTIPLIER))
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

		state.camera.position.x = playerPosition.current.x;
		state.camera.position.z = playerPosition.current.z;
		const standingHeight = 1.7;
		const crouchHeight = CROUCH_CAMERA_OFFSET;
		state.camera.position.y =
			playerPosition.current.y +
			standingHeight -
			(standingHeight - crouchHeight) * crouchProgressRef.current;

		if (jumpScare) {
			playerVelocity.current.x = 0;
			playerVelocity.current.z = 0;
		}
	});
}
