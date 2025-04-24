import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';

const MAX_WALKABLE_WEIGHT = 100;
const OFFSET_X = 304;
const OFFSET_Z = 150;
const MAX_WALL_NEIGHBOR_DISTANCE = 8;
const MAX_ITERATION = 2000;
const EARLY_EXIT_DISTANCE = 2;

const wallDistanceCache = new Map();
const cellWeightCache = new Map();
const neighborCache = new Map();
const pathCache = new Map();

let lastPathfindTime = 0;
const PATH_THROTTLE_MS = 100;

class PriorityQueue {
	constructor() {
		this.elements = [];
	}
	enqueue(element, priority) {
		this.elements.push({ element, priority });
		this.sort();
	}
	dequeue() {
		return this.elements.shift()?.element;
	}
	contains(x, z) {
		return this.elements.some(
			(item) => item.element.x === x && item.element.z === z
		);
	}
	get(x, z) {
		return this.elements.find(
			(item) => item.element.x === x && item.element.z === z
		)?.element;
	}
	remove(x, z) {
		const index = this.elements.findIndex(
			(item) => item.element.x === x && item.element.z === z
		);
		if (index !== -1) {
			this.elements.splice(index, 1);
		}
	}
	update(element, priority) {
		const index = this.elements.findIndex(
			(item) => item.element.x === element.x && item.element.z === element.z
		);

		if (index !== -1) {
			this.elements[index] = { element, priority };
		} else {
			this.elements.push({ element, priority });
		}
		this.sort();
	}
	sort() {
		this.elements.sort((a, b) => a.priority - b.priority);
	}
	get length() {
		return this.elements.length;
	}
	isEmpty() {
		return this.elements.length === 0;
	}
}

const distanceToNearestWall = (
	x,
	z,
	maxSearchRadius = MAX_WALL_NEIGHBOR_DISTANCE
) => {
	const cacheKey = `${x},${z}`;

	if (wallDistanceCache.has(cacheKey)) {
		return wallDistanceCache.get(cacheKey);
	}

	let minDistance = maxSearchRadius;
	const gridState = useGridStore.getState();

	for (let radius = 1; radius <= maxSearchRadius; radius++) {
		let wallFound = false;

		for (let dx = -radius; dx <= radius; dx++) {
			for (let dz = -radius; dz <= radius; dz++) {
				if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;

				const cell = gridState.getCell(x + dx, z + dz);
				if (cell && cell.type === CELL_TYPES.WALL) {
					const distance = Math.sqrt(dx * dx + dz * dz);
					minDistance = Math.min(minDistance, distance);
					wallFound = true;
				}
			}
		}

		if (wallFound) break;
	}

	wallDistanceCache.set(cacheKey, minDistance);
	return minDistance;
};

const lastTargetPos = { x: 0, z: 0 };

const isAdjacentToPlayer = (x, z) => {
	const targetX = lastTargetPos.x;
	const targetZ = lastTargetPos.z;

	if (!targetX || !targetZ) return false;

	const distance = Math.sqrt(
		Math.pow(x - targetX, 2) + Math.pow(z - targetZ, 2)
	);

	return distance <= 3.0;
};

const calculateCellWeight = (cell, x, z) => {
	const cacheKey = `${x},${z}`;

	if (cellWeightCache.has(cacheKey)) {
		return cellWeightCache.get(cacheKey);
	}

	if (isAdjacentToPlayer(x, z)) {
		cellWeightCache.set(cacheKey, 0);
		return 0;
	}

	let weight;
	if (!cell) {
		weight = 1000;
	} else if (cell.type === CELL_TYPES.WALL) {
		weight = 100;
	} else if (
		cell.type === CELL_TYPES.RAISED_AREA_LOW ||
		cell.type === CELL_TYPES.RAISED_AREA_HIGH
	) {
		weight = 20;
	} else {
		const distToWall = distanceToNearestWall(x, z);

		const maxInfluenceDistance = MAX_WALL_NEIGHBOR_DISTANCE;
		const baseWeight = 0;
		const maxAdditionalWeight = 99;

		if (distToWall >= maxInfluenceDistance) {
			weight = baseWeight;
		} else {
			const influenceFactor = 1 - distToWall / maxInfluenceDistance;
			weight = baseWeight + maxAdditionalWeight * influenceFactor;
		}
	}

	cellWeightCache.set(cacheKey, weight);
	return weight;
};

const isWalkable = (cell, x, z) => {
	if (!cell) return false;

	const weight = calculateCellWeight(cell, x, z);
	return weight < MAX_WALKABLE_WEIGHT;
};

const getNeighbors = (x, z, target) => {
	const cacheKey = `${x},${z}`;

	if (neighborCache.has(cacheKey)) {
		return neighborCache.get(cacheKey);
	}

	const gridState = useGridStore.getState();

	const directions = [
		{ x: 1, z: 0, cost: 1 },
		{ x: -1, z: 0, cost: 1 },
		{ x: 0, z: 1, cost: 1 },
		{ x: 0, z: -1, cost: 1 },
		{ x: 1, z: 1, cost: Math.SQRT2 },
		{ x: -1, z: 1, cost: Math.SQRT2 },
		{ x: 1, z: -1, cost: Math.SQRT2 },
		{ x: -1, z: -1, cost: Math.SQRT2 },
	];

	const angleToTarget = Math.atan2(target.z - z, target.x - x);
	const dirVectorX = Math.cos(angleToTarget);
	const dirVectorZ = Math.sin(angleToTarget);

	const neighbors = [];

	for (const dir of directions) {
		const neighborX = Math.round(x + dir.x);
		const neighborZ = Math.round(z + dir.z);

		const cell = gridState.getCell(neighborX, neighborZ);
		if (!cell) continue;

		if (!isWalkable(cell, neighborX, neighborZ)) continue;

		const dirLen = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
		const normDirX = dir.x / dirLen;
		const normDirZ = dir.z / dirLen;

		const dotProduct = normDirX * dirVectorX + normDirZ * dirVectorZ;

		const alignmentPenalty = Math.pow(1 - dotProduct, 2) * 3;

		const cellWeight = calculateCellWeight(cell, neighborX, neighborZ);

		const weightFactor = Math.pow(cellWeight, 2) / 10;

		neighbors.push({
			x: neighborX,
			z: neighborZ,
			cost: dir.cost * (1 + alignmentPenalty) * (1 + weightFactor),
		});
	}

	neighborCache.set(cacheKey, neighbors);
	return neighbors;
};

const heuristic = (a, b) => {
	const directDistance = Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);

	const p = 1 / 1000;
	const dx1 = a.x - b.x;
	const dz1 = a.z - b.z;
	const tieBreaker = p * (Math.abs(dx1) + Math.abs(dz1));

	return directDistance * (1.0 + tieBreaker);
};

const findNearestAccessiblePoint = (point) => {
	const maxSearchRadius = 10;
	let nearestPoint = null;
	let minDistance = Infinity;
	const gridState = useGridStore.getState();

	const spiralDirections = [];
	for (let radius = 1; radius <= maxSearchRadius; radius++) {
		for (let dx = -radius; dx <= radius; dx++) {
			spiralDirections.push({ dx, dz: -radius });
			if (radius !== 0) spiralDirections.push({ dx, dz: radius });
		}
		for (let dz = -radius + 1; dz <= radius - 1; dz++) {
			spiralDirections.push({ dx: -radius, dz });
			spiralDirections.push({ dx: radius, dz });
		}
	}

	for (const dir of spiralDirections) {
		const x = point.x + dir.dx;
		const z = point.z + dir.dz;
		const cell = gridState.getCell(x, z);

		const weight = cell ? calculateCellWeight(cell, x, z) : 1000;
		if (weight < MAX_WALKABLE_WEIGHT) {
			const distance = Math.sqrt(dir.dx * dir.dx + dir.dz * dir.dz);
			if (distance < minDistance) {
				minDistance = distance;
				nearestPoint = { x, z };

				if (distance <= 1) break;
			}
		}
	}

	return nearestPoint;
};

const findAccessiblePointInDirection = (start, target, maxDistance = 15) => {
	const dx = target.x - start.x;
	const dz = target.z - start.z;
	const distance = Math.sqrt(dx * dx + dz * dz);

	const dirX = dx / distance;
	const dirZ = dz / distance;

	const gridState = useGridStore.getState();

	const initialStep = 2;
	let currentStep = initialStep;
	let lastValidPoint = null;

	for (let i = currentStep; i <= maxDistance; i += currentStep) {
		const x = Math.round(start.x + dirX * i);
		const z = Math.round(start.z + dirZ * i);

		if (i > maxDistance * 0.7 && currentStep > 1) {
			currentStep = 1;
		}

		const cell = gridState.getCell(x, z);
		const weight = cell ? calculateCellWeight(cell, x, z) : 1000;

		if (weight < MAX_WALKABLE_WEIGHT) {
			lastValidPoint = { x, z };
		} else if (lastValidPoint) {
			for (let dx = -1; dx <= 1; dx++) {
				for (let dz = -1; dz <= 1; dz++) {
					if (dx === 0 && dz === 0) continue;

					const nx = Math.round(x + dx);
					const nz = Math.round(z + dz);
					const ncell = gridState.getCell(nx, nz);
					const nweight = ncell ? calculateCellWeight(ncell, nx, nz) : 1000;

					if (nweight < MAX_WALKABLE_WEIGHT) {
						return { x: nx, z: nz };
					}
				}
			}
			return lastValidPoint;
		}
	}

	if (lastValidPoint) {
		return lastValidPoint;
	}

	return findNearestAccessiblePoint(start);
};

const smoothPath = (path) => {
	if (path.length <= 2) return path;

	const smoothed = [path[0]];
	let i = 0;
	const maxLookAhead = 8;

	while (i < path.length - 1) {
		const current = path[i];

		let furthestReachable = i + 1;
		const maxJ = Math.min(path.length - 1, i + maxLookAhead);

		for (let j = maxJ; j > i + 1; j--) {
			const target = path[j];

			const distance = Math.sqrt(
				(target.x - current.x) ** 2 + (target.z - current.z) ** 2
			);

			if (distance > 5) {
				const midX = Math.floor((current.x + target.x) / 2);
				const midZ = Math.floor((current.z + target.z) / 2);
				const midCell = useGridStore.getState().getCell(midX, midZ);

				if (!midCell || calculateCellWeight(midCell, midX, midZ) >= 20) {
					continue;
				}
			}

			if (isDirectPathPossible(current, target)) {
				furthestReachable = j;
				break;
			}
		}

		smoothed.push(path[furthestReachable]);
		i = furthestReachable;
	}

	return smoothed;
};

const isDirectPathPossible = (start, end) => {
	const points = bresenhamLine(start.x, start.z, end.x, end.z);

	return points.every((point) => {
		const cell = useGridStore.getState().getCell(point.x, point.z);
		return (
			cell && calculateCellWeight(cell, point.x, point.z) < MAX_WALKABLE_WEIGHT
		);
	});
};

const bresenhamLine = (x0, y0, x1, y1) => {
	const points = [];
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	while (true) {
		points.push({ x: x0, z: y0 });

		if (x0 === x1 && y0 === y1) break;

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x0 += sx;
		}
		if (e2 < dx) {
			err += dx;
			y0 += sy;
		}
	}

	return points;
};

const interpolatePathForDisplay = (smoothedPath, density = 0.5) => {
	if (smoothedPath.length <= 1) return smoothedPath;

	const result = [];

	for (let i = 0; i < smoothedPath.length - 1; i++) {
		const current = smoothedPath[i];
		const next = smoothedPath[i + 1];

		result.push(current);

		const dx = next.x - current.x;
		const dz = next.z - current.z;
		const distance = Math.sqrt(dx * dx + dz * dz);

		const pointsToAdd = Math.max(1, Math.floor(distance * density));

		for (let j = 1; j < pointsToAdd; j++) {
			const ratio = j / pointsToAdd;
			const interpolatedX = Math.round(current.x + dx * ratio);
			const interpolatedZ = Math.round(current.z + dz * ratio);

			const cell = useGridStore
				.getState()
				.getCell(interpolatedX, interpolatedZ);
			const weight = cell
				? calculateCellWeight(cell, interpolatedX, interpolatedZ)
				: 1;

			result.push({
				x: interpolatedX,
				z: interpolatedZ,
				weight: weight,
				isInterpolated: true,
			});
		}
	}

	result.push(smoothedPath[smoothedPath.length - 1]);

	return result;
};

const arePositionsClose = (a, b, threshold = EARLY_EXIT_DISTANCE) => {
	const dx = a.x - b.x;
	const dz = a.z - b.z;
	return Math.sqrt(dx * dx + dz * dz) <= threshold;
};

const resetPathfindingCaches = () => {
	wallDistanceCache.clear();
	cellWeightCache.clear();
	if (neighborCache.size > 500) {
		const keys = Array.from(neighborCache.keys());
		for (let i = 0; i < keys.length - 500; i++) {
			neighborCache.delete(keys[i]);
		}
	}
	if (pathCache.size > 20) {
		const keys = Array.from(pathCache.keys());
		for (let i = 0; i < keys.length - 20; i++) {
			pathCache.delete(keys[i]);
		}
	}
};

export const findPath = (startX, startZ, targetX, targetZ) => {
	const now = Date.now();
	if (now - lastPathfindTime < PATH_THROTTLE_MS) {
		const cacheKey = `${Math.round(startX)},${Math.round(startZ)}_${Math.round(
			targetX
		)},${Math.round(targetZ)}`;
		if (pathCache.has(cacheKey)) {
			return pathCache.get(cacheKey);
		}
	}
	lastPathfindTime = now;

	const cacheKey = `${Math.round(startX)},${Math.round(startZ)}_${Math.round(
		targetX
	)},${Math.round(targetZ)}`;
	if (pathCache.has(cacheKey)) {
		return pathCache.get(cacheKey);
	}

	resetPathfindingCaches();

	lastTargetPos.x = Math.round(targetX) + OFFSET_X;
	lastTargetPos.z = Math.round(targetZ) + OFFSET_Z;

	const gridStartX = Math.round(startX) + OFFSET_X;
	const gridStartZ = Math.round(startZ) + OFFSET_Z;
	const gridTargetX = lastTargetPos.x;
	const gridTargetZ = lastTargetPos.z;

	const start = { x: gridStartX, z: gridStartZ };
	const target = { x: gridTargetX, z: gridTargetZ };

	if (arePositionsClose({ x: startX, z: startZ }, { x: targetX, z: targetZ })) {
		const directPath = [
			{ x: startX, z: startZ, cost: 1, weight: 1 },
			{ x: targetX, z: targetZ, cost: 1, weight: 1 },
		];

		if (window.location.hash.includes('#debug')) {
			const debugPath = directPath.map((point) => ({
				...point,
				isInterpolated: false,
			}));
			printPathASCII(debugPath);
		}

		pathCache.set(cacheKey, directPath);
		return directPath;
	}

	const gridState = useGridStore.getState();

	const startCell = gridState.getCell(start.x, start.z);
	const startWeight = startCell
		? calculateCellWeight(startCell, start.x, start.z)
		: 1000;

	if (startWeight > MAX_WALKABLE_WEIGHT) {
		const nearestStart = findAccessiblePointInDirection(start, target);
		if (!nearestStart) {
			console.warn('No accessible point found near start position');
			return null;
		}
		Object.assign(start, nearestStart);
	}

	const targetCell = gridState.getCell(target.x, target.z);
	const targetWeight = targetCell
		? calculateCellWeight(targetCell, target.x, target.z)
		: 1000;

	if (targetWeight > MAX_WALKABLE_WEIGHT) {
		const nearestTarget = findNearestAccessiblePoint(target);
		if (!nearestTarget) {
			console.warn('No accessible point found near target position');
			return null;
		}
		Object.assign(target, nearestTarget);
	}

	const openSet = new PriorityQueue();
	const closedSet = new Set();
	const gScore = new Map();
	const fScore = new Map();
	const cameFrom = new Map();

	const startKey = `${start.x},${start.z}`;
	gScore.set(startKey, 0);
	const initialFScore = heuristic(start, target);
	fScore.set(startKey, initialFScore);
	openSet.enqueue(start, initialFScore);

	let iterations = 0;

	while (!openSet.isEmpty() && iterations < MAX_ITERATION) {
		iterations++;

		const current = openSet.dequeue();
		const currentKey = `${current.x},${current.z}`;

		if (arePositionsClose(current, target)) {
			const path = [];
			let curr = current;
			let currKey = currentKey;

			while (cameFrom.has(currKey)) {
				const cell = gridState.getCell(curr.x, curr.z);
				curr.weight = calculateCellWeight(cell, curr.x, curr.z);
				path.unshift(curr);
				curr = cameFrom.get(currKey);
				currKey = `${curr.x},${curr.z}`;
			}
			start.weight = calculateCellWeight(startCell, start.x, start.z);
			path.unshift(start);

			const rawPath = path.map((point) => ({
				x: point.x,
				z: point.z,
				weight: point.weight || 1,
			}));

			const smoothedPath = smoothPath(rawPath);

			const displayPath = interpolatePathForDisplay(smoothedPath);

			const worldPath = smoothedPath.map((point) => ({
				x: point.x - OFFSET_X,
				z: point.z - OFFSET_Z,
				cost: point.cost || 1,
				weight: point.weight || 1,
			}));

			if (window.location.hash.includes('#debug')) {
				const worldDisplayPath = displayPath.map((point) => ({
					x: point.x - OFFSET_X,
					z: point.z - OFFSET_Z,
					cost: point.cost || 1,
					weight: point.weight || 1,
					isInterpolated: point.isInterpolated || false,
				}));
				printPathASCII(worldDisplayPath);
			}

			pathCache.set(cacheKey, worldPath);

			return worldPath;
		}

		if (current.x === target.x && current.z === target.z) {
			const path = [];
			let curr = current;
			let currKey = currentKey;

			while (cameFrom.has(currKey)) {
				const cell = gridState.getCell(curr.x, curr.z);
				curr.weight = calculateCellWeight(cell, curr.x, curr.z);
				path.unshift(curr);
				curr = cameFrom.get(currKey);
				currKey = `${curr.x},${curr.z}`;
			}
			start.weight = calculateCellWeight(startCell, start.x, start.z);
			path.unshift(start);

			const rawPath = path.map((point) => ({
				x: point.x,
				z: point.z,
				weight: point.weight || 1,
			}));

			const smoothedPath = smoothPath(rawPath);

			const displayPath = interpolatePathForDisplay(smoothedPath);

			const worldPath = smoothedPath.map((point) => ({
				x: point.x - OFFSET_X,
				z: point.z - OFFSET_Z,
				cost: point.cost || 1,
				weight: point.weight || 1,
			}));

			if (window.location.hash.includes('#debug')) {
				const worldDisplayPath = displayPath.map((point) => ({
					x: point.x - OFFSET_X,
					z: point.z - OFFSET_Z,
					cost: point.cost || 1,
					weight: point.weight || 1,
					isInterpolated: point.isInterpolated || false,
				}));
				printPathASCII(worldDisplayPath);
			}

			pathCache.set(cacheKey, worldPath);

			return worldPath;
		}

		closedSet.add(currentKey);

		for (const neighbor of getNeighbors(current.x, current.z, target)) {
			const neighborKey = `${neighbor.x},${neighbor.z}`;

			if (closedSet.has(neighborKey)) {
				continue;
			}

			const tentativeGScore = gScore.get(currentKey) + neighbor.cost;

			if (
				!gScore.has(neighborKey) ||
				tentativeGScore < gScore.get(neighborKey)
			) {
				cameFrom.set(neighborKey, current);
				gScore.set(neighborKey, tentativeGScore);
				const newFScore = tentativeGScore + heuristic(neighbor, target);
				fScore.set(neighborKey, newFScore);

				openSet.update(neighbor, newFScore);
			}
		}
	}

	const reason =
		iterations >= MAX_ITERATION
			? 'maximum iterations reached'
			: 'no path found';
	console.error(
		`Pathfinding failed from world(${startX}, ${startZ}) to world(${targetX}, ${targetZ}): ${reason}`,
		`Grid coords: (${gridStartX}, ${gridStartZ}) to (${gridTargetX}, ${gridTargetZ})`
	);

	console.warn('Pathfinding failed. Forcing direct movement towards player.');

	const dx = targetX - startX;
	const dz = targetZ - startZ;
	const distance = Math.sqrt(dx * dx + dz * dz);

	const dirX = dx / distance;
	const dirZ = dz / distance;

	const directPath = [];
	directPath.push({ x: startX, z: startZ, cost: 1, weight: 1 });

	const numPoints = 3;
	for (let i = 1; i < numPoints; i++) {
		const ratio = i / numPoints;
		const intermediateX = startX + dirX * distance * ratio;
		const intermediateZ = startZ + dirZ * distance * ratio;
		directPath.push({
			x: intermediateX,
			z: intermediateZ,
			cost: 1,
			weight: 1,
			forcedPath: true,
		});
	}

	directPath.push({
		x: targetX,
		z: targetZ,
		cost: 1,
		weight: 1,
		forcedPath: true,
	});

	pathCache.set(cacheKey, directPath);

	resetPathfindingCaches();
	return directPath;
};

const printPathASCII = (path) => {
	if (!path) return;

	const gridState = useGridStore.getState();

	const gridPath = path.map((point) => ({
		x: Math.round(point.x) + OFFSET_X,
		z: Math.round(point.z) + OFFSET_Z,
		cost: point.cost || 1,
		weight: point.weight || 1,
	}));

	let minX = Infinity,
		maxX = -Infinity,
		minZ = Infinity,
		maxZ = -Infinity;

	gridPath.forEach((point) => {
		minX = Math.min(minX, point.x);
		maxX = Math.max(maxX, point.x);
		minZ = Math.min(minZ, point.z);
		maxZ = Math.max(maxZ, point.z);
	});

	if (lastTargetPos.x && lastTargetPos.z) {
		minX = Math.min(minX, lastTargetPos.x - 5);
		maxX = Math.max(maxX, lastTargetPos.x + 5);
		minZ = Math.min(minZ, lastTargetPos.z - 5);
		maxZ = Math.max(maxZ, lastTargetPos.z + 5);
	}

	minX = Math.max(0, minX - 10);
	minZ = Math.max(0, minZ - 10);
	maxX = maxX + 10;
	maxZ = maxZ + 10;

	const width = maxX - minX;
	const height = maxZ - minZ;

	const heightScaleFactor = 1;
	const widthScaleFactor = 2;
	const scaledHeight = Math.ceil(height / heightScaleFactor);
	const scaledWidth = Math.ceil(width / widthScaleFactor);

	const yellowPath = '\x1b[48;2;255;255;0m  \x1b[0m';
	const playerPos = '\x1b[48;2;0;255;0m  \x1b[0m';
	const monsterPos = '\x1b[48;2;255;0;0m  \x1b[0m';

	const getWeightChar = (weight) => {
		const normalizedWeight = Math.min(100, Math.max(0, weight));
		const blueValue = Math.floor((normalizedWeight / 100) * 255);
		return `\x1b[48;2;0;0;${blueValue}m  \x1b[0m`;
	};

	const pathCells = new Map();
	gridPath.forEach((point) => {
		pathCells.set(`${point.x},${point.z}`, point.weight || 1);
	});

	let asciiGrid = 'PATH VISUALIZATION WITH WEIGHTS\n';
	asciiGrid += `World: (${path[0].x}, ${path[0].z}) → (${
		path[path.length - 1].x
	}, ${path[path.length - 1].z})\n`;
	asciiGrid += `Grid: (${gridPath[0].x}, ${gridPath[0].z}) → (${
		gridPath[path.length - 1].x
	}, ${gridPath[path.length - 1].z})\n\n`;

	if (lastTargetPos.x && lastTargetPos.z) {
		asciiGrid += `Player grid position: (${lastTargetPos.x}, ${lastTargetPos.z})\n`;
	}

	asciiGrid += `${getWeightChar(100)} Blue 100% (Unwalkable)  `;
	asciiGrid += `${getWeightChar(0)} Blue 0% (Walkable)  `;
	asciiGrid += `${yellowPath} Path  `;
	asciiGrid += `${playerPos} Player  `;
	asciiGrid += `${monsterPos} Monster  `;
	asciiGrid += '\n';

	for (let x = 0; x < scaledWidth; x++) {
		const actualX = minX + x * widthScaleFactor;
		asciiGrid += actualX.toString().padStart(3, ' ') + '|';

		for (let z = 0; z < scaledHeight; z++) {
			let hasPath = false;
			let isStart = false;
			let isEnd = false;
			let cellWeight = 1;

			for (let dx = 0; dx < widthScaleFactor; dx++) {
				for (let dz = 0; dz < heightScaleFactor; dz++) {
					const realX = minX + x * widthScaleFactor + dx;
					const realZ = minZ + z * heightScaleFactor + dz;
					const key = `${realX},${realZ}`;

					if (realX === gridPath[0].x && realZ === gridPath[0].z) {
						isStart = true;
					}
					if (
						realX === gridPath[gridPath.length - 1].x &&
						realZ === gridPath[gridPath.length - 1].z
					) {
						isEnd = true;
					}

					if (pathCells.has(key)) {
						hasPath = true;
					}

					try {
						const cell = gridState.getCell(realX, realZ);
						if (cell) {
							const weight = calculateCellWeight(cell, realX, realZ);
							cellWeight = Math.max(cellWeight, weight);
						}
					} catch (e) {
						console.error(e);
					}
				}
			}

			if (isStart) {
				asciiGrid += monsterPos;
			} else if (isEnd) {
				asciiGrid += playerPos;
			} else if (hasPath) {
				asciiGrid += yellowPath;
			} else {
				asciiGrid += getWeightChar(cellWeight);
			}
		}
		asciiGrid += '\n';
	}

	console.log(asciiGrid);
	console.groupEnd();
};
