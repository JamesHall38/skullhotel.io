import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useMonster from '../../hooks/useMonster';

const GRID_OFFSET_X = 600;
const GRID_OFFSET_Z = 150;

export default function Crouch({ setIsCrouching, playerPosition }) {
	const getCell = useGridStore((state) => state.getCell);
	const [wantsToStandUp, setWantsToStandUp] = useState(false);
	const monsterState = useMonster((state) => state.monsterState);

	useEffect(() => {
		if (monsterState === 'run') {
			setIsCrouching(false);
		}
	}, [monsterState, setIsCrouching]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (monsterState === 'run') {
				setIsCrouching(false);
				return;
			}

			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				setIsCrouching(true);
			}
			if (event.ctrlKey) {
				event.preventDefault();
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				const cellX = Math.floor(playerPosition.current.x * 10 + GRID_OFFSET_X);
				const cellZ = Math.floor(playerPosition.current.z * 10 + GRID_OFFSET_Z);
				const cell = getCell(cellX, cellZ);

				if (
					cell.type !== CELL_TYPES.CROUCH_ONLY &&
					cell.type !== CELL_TYPES.DESK_DOOR_CLOSED &&
					cell.type !== CELL_TYPES.NIGHTSTAND_DOOR_CLOSED
				) {
					setIsCrouching(false);
				} else {
					setWantsToStandUp(true);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [getCell, playerPosition, setIsCrouching, monsterState]);

	useFrame(() => {
		if (wantsToStandUp) {
			const cellX = Math.floor(playerPosition.current.x * 10 + GRID_OFFSET_X);
			const cellZ = Math.floor(playerPosition.current.z * 10 + GRID_OFFSET_Z);
			const cell = getCell(cellX, cellZ);
			if (
				cell.type !== CELL_TYPES.CROUCH_ONLY &&
				cell.type !== CELL_TYPES.DESK_DOOR_CLOSED &&
				cell.type !== CELL_TYPES.NIGHTSTAND_DOOR_CLOSED
			) {
				setIsCrouching(false);
				setWantsToStandUp(false);
			}
		}
	});

	return null;
}
