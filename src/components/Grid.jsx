// // THIS COMPONENT VISUALIZES COLLISION BOXES BUT CONSUMES A LOT OF RESOURCES
// // ONLY UNCOMMENT IN DEVELOPMENT

// import React, { useState, useEffect } from 'react';
// import { Box } from '@react-three/drei';
// import useGridStore, { CELL_TYPES } from '../hooks/useGrid';
// import useGameplaySettings from '../hooks/useGameplaySettings';

const Grid = () => {
	// const { grid } = useGridStore();
	// const roomCount = useGameplaySettings((state) => state.roomCount);
	// const [gridOffsetX, setGridOffsetX] = useState(0);

	// useEffect(() => {
	// 	setGridOffsetX(roomCount * 29.5 + 10);
	// }, [roomCount]);

	// const getCellColor = (cellType, hidingSpot) => {
	// 	if (hidingSpot) {
	// 		return 'magenta';
	// 	}
	// 	switch (cellType) {
	// 		// case CELL_TYPES.WALL:
	// 		// 	return 'gray';
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
	// 		<meshStandardMaterial color={getCellColor(cell.type, cell.hidingSpot)} />
	// 	</Box>
	// );

	return (
		<group>
			{/* <group position={[-gridOffsetX / 10, 0.5, -15]}>
			{Object.values(grid).map((cell) =>
				cell.type !== CELL_TYPES.EMPTY || cell.hidingSpot
					? renderCell(cell, `cell-${cell.x},${cell.z}`)
					: null
			)}
		</group> */}
		</group>
	);
};

export default Grid;
