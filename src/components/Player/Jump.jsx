import { useEffect, useRef, useState } from 'react';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useDoorStore from '../../hooks/useDoor';
import useMonster from '../../hooks/useMonster';

const GRID_OFFSET_X = 600;
const GRID_OFFSET_Z = 150;
const RAISED_AREA_LOW_HEIGHT = 0.5;
const RAISED_AREA_HIGH_HEIGHT = 0.7;
const CROUCH_CAMERA_OFFSET = 0.8;
const JUMP_FORCE = 1.5;
const GRAVITY = 8;
const CEILING_HEIGHT = 0.7;
const floor = -0.2;

export default function Jump({ playerPosition, playerVelocity, isCrouching }) {
	const playerPositionRoom = useGame((state) => state.realPlayerPositionRoom);
	const monsterState = useMonster((state) => state.monsterState);
	const getCell = useGridStore((state) => state.getCell);
	const [jumpState, setJumpState] = useState('grounded');
	const [canJump, setCanJump] = useState(true);
	const [spacePressed, setSpacePressed] = useState(false);
	const jumpVelocity = useRef(0);
	const [isInsideDoor, setIsInsideDoor] = useState(false);
	const [jumpedFromBed, setJumpedFromBed] = useState(false);

	const {
		roomDoor,
		bathroomDoor,
		roomCurtain,
		bathroomCurtain,
		desk,
		nightStand,
		exit,
		tutorial,
		corridor,
	} = useDoorStore((state) => ({
		roomDoor: state.roomDoor,
		bathroomDoor: state.bathroomDoor,
		roomCurtain: state.roomCurtain,
		bathroomCurtain: state.bathroomCurtain,
		desk: state.desk,
		nightStand: state.nightStand,
		exit: state.exit,
		tutorial: state.tutorial,
		corridor: state.corridor,
	}));

	const isRaisedArea = (pos) => {
		const cellX = Math.floor(pos.x * 10 + GRID_OFFSET_X);
		const cellZ = Math.floor(pos.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);
		return (
			cell.type === CELL_TYPES.RAISED_AREA_LOW ||
			cell.type === CELL_TYPES.RAISED_AREA_HIGH ||
			cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED ||
			cell.type === CELL_TYPES.BED
		);
	};

	const getRaisedAreaHeight = (pos) => {
		const cellX = Math.floor(pos.x * 10 + GRID_OFFSET_X);
		const cellZ = Math.floor(pos.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);
		if (cell.type === CELL_TYPES.RAISED_AREA_LOW) {
			return RAISED_AREA_LOW_HEIGHT;
		} else if (
			cell.type === CELL_TYPES.RAISED_AREA_HIGH ||
			cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED ||
			cell.type === CELL_TYPES.BED
		) {
			return RAISED_AREA_HIGH_HEIGHT;
		}
		return 0;
	};
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
			cell.type === CELL_TYPES.ROOM_DOOR_OPEN &&
			roomDoor[playerPositionRoom]
		) {
			return true;
		}

		if (
			(cell.type === CELL_TYPES.ROOM_DOOR_CLOSED &&
				!roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_CLOSED && !bathroomDoor) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN && bathroomDoor) ||
			(cell.type === CELL_TYPES.ROOM_CURTAIN_CLOSED && !roomCurtain) ||
			(cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED && !bathroomCurtain) ||
			(cell.type === CELL_TYPES.DESK_DOOR_CLOSED && !desk) ||
			(cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED && !nightStand) ||
			(cell.type === CELL_TYPES.EXIT_DOOR_CLOSED && !exit) ||
			(cell.type === CELL_TYPES.TUTORIAL_DOOR_CLOSED && !tutorial) ||
			(cell.type === CELL_TYPES.CORRIDOR_DOOR_CLOSED && !corridor) ||
			(cell.type === CELL_TYPES.TUTORIAL_DOOR_OPEN && tutorial) ||
			(cell.type === CELL_TYPES.CORRIDOR_DOOR_OPEN && corridor) ||
			(cell.type === CELL_TYPES.EXIT_DOOR_OPEN && exit)
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
			!isCrouching
		) {
			return true;
		}
		return false;
	};

	// const isHighRaisedArea = (pos) => {
	// 	const cellX = Math.floor(pos.x * 10 + GRID_OFFSET_X);
	// 	const cellZ = Math.floor(pos.z * 10 + GRID_OFFSET_Z);
	// 	const cell = getCell(cellX, cellZ);
	// 	return (
	// 		cell.type === CELL_TYPES.RAISED_AREA_HIGH ||
	// 		cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED
	// 	);
	// };

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'Space' && !spacePressed) {
				setSpacePressed(true);
				setCanJump(true);
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'Space') {
				setSpacePressed(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [spacePressed]);

	useEffect(() => {
		const cellX = Math.floor(playerPosition.current.x * 10 + GRID_OFFSET_X);
		const cellZ = Math.floor(playerPosition.current.z * 10 + GRID_OFFSET_Z);
		const cell = getCell(cellX, cellZ);

		if (
			(cell.type === CELL_TYPES.ROOM_DOOR_OPEN &&
				roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.ROOM_DOOR_CLOSED &&
				!roomDoor[playerPositionRoom]) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN && bathroomDoor) ||
			(cell.type === CELL_TYPES.BATHROOM_DOOR_CLOSED && !bathroomDoor) ||
			(cell.type === CELL_TYPES.ROOM_CURTAIN_CLOSED && !roomCurtain) ||
			(cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED && !bathroomCurtain) ||
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

	useFrame((state, delta) => {
		if (
			monsterState !== 'run' &&
			playerVelocity?.current &&
			playerPosition?.current
		) {
			if (
				spacePressed &&
				jumpState === 'grounded' &&
				canJump
				// &&
				// !isHighRaisedArea(playerPosition.current)
			) {
				const currentCell = getCell(
					Math.floor(playerPosition.current.x * 10 + GRID_OFFSET_X),
					Math.floor(playerPosition.current.z * 10 + GRID_OFFSET_Z)
				);
				setJumpedFromBed(currentCell.type === CELL_TYPES.BED);
				setJumpState('jumping');
				jumpVelocity.current = JUMP_FORCE;
				setCanJump(false);
			}

			if (jumpState === 'grounded' && !spacePressed) {
				setCanJump(true);
			}

			if (jumpState !== 'grounded') {
				jumpVelocity.current -= GRAVITY * delta;
			}

			const newPosition = playerPosition.current.clone();
			newPosition.x += playerVelocity.current.x * delta;
			newPosition.z += playerVelocity.current.z * delta;
			newPosition.y += jumpVelocity.current * delta * 5;

			if (newPosition.y >= CEILING_HEIGHT && !jumpedFromBed) {
				newPosition.y = CEILING_HEIGHT;
				jumpVelocity.current = 0;
			}

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
			playerPosition.current.y = newPosition.y;

			if (isRaisedArea(playerPosition.current)) {
				const raisedAreaHeight = getRaisedAreaHeight(playerPosition.current);
				if (playerPosition.current.y <= floor + raisedAreaHeight) {
					if (playerPosition.current.y <= floor + raisedAreaHeight) {
						playerPosition.current.y = floor + raisedAreaHeight;
						jumpVelocity.current = 0;
						setJumpState('grounded');
					}
				} else if (
					jumpState === 'grounded' &&
					playerPosition.current.y > floor + raisedAreaHeight
				) {
					setJumpState('falling');
				}
			} else {
				if (jumpState === 'grounded' && playerPosition.current.y > floor) {
					setJumpState('falling');
				}

				if (playerPosition.current.y <= floor) {
					playerPosition.current.y = floor;
					jumpVelocity.current = 0;
					setJumpState('grounded');
				} else if (jumpVelocity.current < 0) {
					setJumpState('falling');
				}
			}

			state.camera.position.y = playerPosition.current.y;
			state.camera.position.y += isCrouching ? CROUCH_CAMERA_OFFSET : 1.7;

			if (
				jumpState === 'falling' &&
				(playerPosition.current.y <= floor ||
					(isRaisedArea(playerPosition.current) &&
						playerPosition.current.y <=
							floor + getRaisedAreaHeight(playerPosition.current)))
			) {
				setJumpedFromBed(false);
			}
		}
	});
}
