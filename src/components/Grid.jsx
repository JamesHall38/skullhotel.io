// import React, { useMemo } from 'react';
// import { Box } from '@react-three/drei';
// import useGridStore, { CELL_TYPES } from '../hooks/useGrid';

const Grid = () => {
	// const { getAllWalls, getAllBoundaries, grid } = useGridStore();

	// // eslint-disable-next-line react-hooks/exhaustive-deps
	// const walls = useMemo(() => getAllWalls(), [getAllWalls, grid]);
	// const boundaries = useMemo(() => getAllBoundaries(), [getAllBoundaries]);

	// const filteredBoundaries = useMemo(
	// 	() => boundaries.filter((cell) => cell.type !== CELL_TYPES.WALL),
	// 	[boundaries]
	// );

	// const getCellColor = (cellType) => {
	// 	switch (cellType) {
	// 		case CELL_TYPES.WALL:
	// 			return 'gray';
	// 		case CELL_TYPES.RAISED_AREA_LOW:
	// 			return 'darkblue';
	// 		case CELL_TYPES.RAISED_AREA_HIGH:
	// 			return 'green';
	// 		case CELL_TYPES.CROUCH_ONLY:
	// 			return 'lightblue';
	// 		case CELL_TYPES.DOOR_CLOSED:
	// 			return 'red';
	// 		case CELL_TYPES.ROOM_DOOR_OPEN:
	// 		case CELL_TYPES.BATHROOM_DOOR_OPEN:
	// 		case CELL_TYPES.DESK_DOOR_OPEN:
	// 		case CELL_TYPES.NIGHTSTAND_DOOR_OPEN:
	// 			return 'green';
	// 		default:
	// 			return 'red';
	// 	}
	// };

	// const renderCell = (cell, key) => (
	// 	<Box
	// 		key={key}
	// 		position={[cell.x * 0.1, 0.05, cell.z * 0.1]}
	// 		args={[0.1, 0.1, 0.1]}
	// 	>
	// 		<meshStandardMaterial color={getCellColor(cell.type)} />
	// 	</Box>
	// );

	return (
		<group position={[-60, 0.5, -15]}>
			{/* {Object.values(grid).map((cell) =>
				cell.type !== CELL_TYPES.EMPTY
					? renderCell(cell, `cell-${cell.x},${cell.z}`)
					: null
			)} */}
			{/* {walls.map((wall) => renderCell(wall, `wall-${wall.x},${wall.z}`))} */}
			{/* {filteredBoundaries.map((boundary) =>
				renderCell(boundary, `boundary-${boundary.x},${boundary.z}`)
			)} */}
		</group>
	);
};

export default Grid;
