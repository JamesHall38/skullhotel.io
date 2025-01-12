import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';

const hasWallInRange = (x, z, range = 3) => {
	for (let dx = -range; dx <= range; dx++) {
		for (let dz = -range; dz <= range; dz++) {
			// Skip checking the cell itself
			if (dx === 0 && dz === 0) continue;

			const cell = useGridStore.getState().getCell(x + dx, z + dz);
			if (cell && cell.type === CELL_TYPES.WALL) {
				return true;
			}
		}
	}
	return false;
};

const isWalkable = (cell, x, z) => {
	if (!cell) return false;
	if (cell.type === CELL_TYPES.WALL) return false;
	if (hasWallInRange(x, z, 2)) return false;
	return true;
};

const getNeighbors = (x, z, target) => {
	const directions = [];
	const numDirections = 16;

	for (let i = 0; i < numDirections; i++) {
		const angle = (2 * Math.PI * i) / numDirections;
		directions.push({
			x: Math.cos(angle),
			z: Math.sin(angle),
			cost: 1,
		});
	}

	const angleToTarget = Math.atan2(target.z - z, target.x - x);

	return directions
		.map((dir) => {
			const neighborX = Math.round(x + dir.x);
			const neighborZ = Math.round(z + dir.z);

			const directionAngle = Math.atan2(dir.z, dir.x);
			const angleDiff = Math.abs(angleToTarget - directionAngle);

			return {
				x: neighborX,
				z: neighborZ,
				cost: dir.cost * (1 + angleDiff * 0.5),
			};
		})
		.filter((pos) => {
			const cell = useGridStore.getState().getCell(pos.x, pos.z);
			return isWalkable(cell, pos.x, pos.z);
		});
};

const heuristic = (a, b) => {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
};

const findNearestAccessiblePoint = (point) => {
	const maxSearchRadius = 10;
	let nearestPoint = null;
	let minDistance = Infinity;

	for (let dx = -maxSearchRadius; dx <= maxSearchRadius; dx++) {
		for (let dz = -maxSearchRadius; dz <= maxSearchRadius; dz++) {
			const x = point.x + dx;
			const z = point.z + dz;
			const cell = useGridStore.getState().getCell(x, z);

			if (isWalkable(cell, x, z)) {
				const distance = Math.sqrt(dx * dx + dz * dz);
				if (distance < minDistance) {
					minDistance = distance;
					nearestPoint = { x, z };
				}
			}
		}
	}

	return nearestPoint;
};

export const findPath = (startX, startZ, targetX, targetZ) => {
	let start = { x: Math.round(startX), z: Math.round(startZ) };
	let target = { x: Math.round(targetX), z: Math.round(targetZ) };

	const startCell = useGridStore.getState().getCell(start.x, start.z);
	if (!isWalkable(startCell, start.x, start.z)) {
		const nearestStart = findNearestAccessiblePoint(start);
		if (!nearestStart) {
			console.warn('No accessible point found near start position');
			return null;
		}
		start = nearestStart;
	}

	const targetCell = useGridStore.getState().getCell(target.x, target.z);
	if (!isWalkable(targetCell, target.x, target.z)) {
		const nearestTarget = findNearestAccessiblePoint(target);
		if (!nearestTarget) {
			console.warn('No accessible point found near target position');
			return null;
		}
		target = nearestTarget;
	}

	const maxDistance = 200;
	if (heuristic(start, target) > maxDistance) {
		console.warn('Target is too far, aborting pathfinding');
		return null;
	}

	const openSet = [start];
	const closedSet = new Set();
	const cameFrom = new Map();
	const gScore = new Map();
	gScore.set(`${start.x},${start.z}`, 0);
	const fScore = new Map();
	fScore.set(`${start.x},${start.z}`, heuristic(start, target));

	let iterations = 0;
	const maxIterations = 3000;

	while (openSet.length > 0 && iterations < maxIterations) {
		iterations++;

		let current = openSet[0];
		let currentIndex = 0;
		let lowestFScore = fScore.get(`${current.x},${current.z}`);

		for (let i = 1; i < openSet.length; i++) {
			const fScoreI = fScore.get(`${openSet[i].x},${openSet[i].z}`);
			if (fScoreI < lowestFScore) {
				lowestFScore = fScoreI;
				current = openSet[i];
				currentIndex = i;
			}
		}

		if (current.x === target.x && current.z === target.z) {
			const path = [];
			let curr = current;
			while (cameFrom.has(`${curr.x},${curr.z}`)) {
				path.unshift(curr);
				curr = cameFrom.get(`${curr.x},${curr.z}`);
			}
			path.unshift(start);

			// if (path) {
			// 	printPathASCII(path);
			// }
			return path;
		}

		openSet.splice(currentIndex, 1);
		closedSet.add(`${current.x},${current.z}`);

		for (const neighbor of getNeighbors(current.x, current.z, target)) {
			if (closedSet.has(`${neighbor.x},${neighbor.z}`)) {
				continue;
			}

			const tentativeGScore =
				gScore.get(`${current.x},${current.z}`) + neighbor.cost;

			if (
				!gScore.has(`${neighbor.x},${neighbor.z}`) ||
				tentativeGScore < gScore.get(`${neighbor.x},${neighbor.z}`)
			) {
				cameFrom.set(`${neighbor.x},${neighbor.z}`, current);
				gScore.set(`${neighbor.x},${neighbor.z}`, tentativeGScore);
				fScore.set(
					`${neighbor.x},${neighbor.z}`,
					tentativeGScore + heuristic(neighbor, target)
				);

				if (!openSet.find((p) => p.x === neighbor.x && p.z === neighbor.z)) {
					openSet.push(neighbor);
				}
			}
		}
	}

	const reason =
		iterations >= maxIterations
			? 'maximum iterations reached'
			: 'no path found';
	console.error(
		`Pathfinding failed from (${startX}, ${startZ}) to (${targetX}, ${targetZ}): ${reason}`
	);
	return null;
};

// const printPathASCII = (path) => {
// 	if (!path) return;

// 	// Create a copy of the grid
// 	const gridCopy = { ...useGridStore.getState().grid };

// 	// Mark the path on the grid copy
// 	path.forEach((point) => {
// 		const key = `${point.x},${point.z}`;
// 		if (gridCopy[key]) {
// 			gridCopy[key] = {
// 				...gridCopy[key],
// 				type: 'path',
// 			};
// 		}
// 	});

// 	// Print ASCII with path
// 	const { width, height } = useGridStore.getState().gridSize;
// 	let asciiGrid = '';
// 	const heightScaleFactor = 2;
// 	const widthScaleFactor = 4;
// 	const scaledHeight = Math.ceil(height / heightScaleFactor);
// 	const scaledWidth = Math.ceil(width / widthScaleFactor);

// 	const lightBlue = '\x1b[94m■\x1b[0m';
// 	const darkBlue = '\x1b[34m■\x1b[0m';
// 	const mediumBlue = '\x1b[36m■\x1b[0m';
// 	const redDoor = '\x1b[31m■\x1b[0m';
// 	const greenDoor = '\x1b[32m■\x1b[0m';
// 	const yellowPath = '\x1b[33m●\x1b[0m';

// 	asciiGrid +=
// 		'   0                       50                      100                      150                      200                      250                      300\n\n';

// 	for (let x = scaledWidth - 1; x >= 0; x--) {
// 		asciiGrid += (x * widthScaleFactor).toString().padStart(3, ' ') + '|';
// 		for (let z = 0; z < scaledHeight; z++) {
// 			let hasWall = false;
// 			let hasLowArea = false;
// 			let hasHighArea = false;
// 			let hasBoundary = false;
// 			let hasCrouchOnly = false;
// 			let hasDoor = false;
// 			let hasOpenDoor = false;
// 			let hasPath = false;

// 			for (let dx = 0; dx < widthScaleFactor; dx++) {
// 				for (let dz = 0; dz < heightScaleFactor; dz++) {
// 					const realX = x * widthScaleFactor + dx;
// 					const realZ = z * heightScaleFactor + dz;
// 					const cell = gridCopy[`${realX},${realZ}`];

// 					if (cell) {
// 						if (cell.type === 'path') {
// 							hasPath = true;
// 						} else if (cell.type === CELL_TYPES.WALL) {
// 							hasWall = true;
// 						} else if (cell.type === CELL_TYPES.RAISED_AREA_LOW) {
// 							hasLowArea = true;
// 						} else if (cell.type === CELL_TYPES.RAISED_AREA_HIGH) {
// 							hasHighArea = true;
// 						} else if (cell.type === CELL_TYPES.CROUCH_ONLY) {
// 							hasCrouchOnly = true;
// 						} else if (cell.type.includes('Closed')) {
// 							hasDoor = true;
// 						} else if (cell.type.includes('Open')) {
// 							hasOpenDoor = true;
// 						} else if (cell.boundary) {
// 							hasBoundary = true;
// 						}
// 					}
// 				}
// 			}

// 			if (hasPath) {
// 				asciiGrid += yellowPath;
// 			} else if (hasWall) {
// 				asciiGrid += '█';
// 			} else if (hasDoor) {
// 				asciiGrid += redDoor;
// 			} else if (hasOpenDoor) {
// 				asciiGrid += greenDoor;
// 			} else if (hasLowArea) {
// 				asciiGrid += lightBlue;
// 			} else if (hasHighArea) {
// 				asciiGrid += darkBlue;
// 			} else if (hasCrouchOnly) {
// 				asciiGrid += mediumBlue;
// 			} else if (hasBoundary) {
// 				asciiGrid += '▒';
// 			} else {
// 				asciiGrid += '·';
// 			}
// 		}
// 		asciiGrid += '\n';
// 	}

// 	asciiGrid +=
// 		'   0                        50                      100                      150                      200                      250                      300';
// 	console.group('Grid Display');
// 	console.table(asciiGrid);
// 	console.groupEnd();
// };
