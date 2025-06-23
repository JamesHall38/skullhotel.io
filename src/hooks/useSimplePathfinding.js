import { useCallback } from 'react';

const WALL_OPENINGS = [
	{
		type: 'z',
		zPosition: 8,
		getOpeningX: (roomOffsetX, isBottomRow = false) => {
			const baseOffset = isBottomRow ? 1.3 : -1.3;
			return roomOffsetX + baseOffset + 2.92;
		},
	},
	{
		type: 'z',
		zPosition: 4.4,
		getOpeningX: (roomOffsetX, isBottomRow = false) => {
			const baseOffset = isBottomRow ? 0.5 : -0.5;
			return roomOffsetX + baseOffset + 2.92;
		},
	},
	{
		type: 'z',
		zPosition: 1.4,
		getOpeningX: (roomOffsetX, isBottomRow = false) => {
			const baseOffset = isBottomRow ? 0 : 0;
			return roomOffsetX + baseOffset + 2.92;
		},
	},
	{
		type: 'x',
		xPosition: -1.35,
		getWaypointX: (roomOffsetX, isBottomRow = false) => {
			const baseOffset = isBottomRow ? 1.35 : -1.35;
			return roomOffsetX + baseOffset + 2.92;
		},
		getWaypointZ: () => 3.7,
	},
];

const CORRIDOR_LENGTH = 5.95;
const offset = [8.83, 0, 6.2];

const useSimplePathfinding = () => {
	const findPath = useCallback(
		async (
			startX,
			startZ,
			targetX,
			targetZ,
			playerPositionRoom,
			roomCount,
			visitedWaypoints = {},
			isRaidMode = false
		) => {
			const isBottomRow = playerPositionRoom >= roomCount / 2;

			let roomOffsetX;
			if (isBottomRow) {
				roomOffsetX =
					offset[0] -
					CORRIDOR_LENGTH -
					(playerPositionRoom - Math.floor(roomCount / 2)) * CORRIDOR_LENGTH -
					5.84;
			} else {
				roomOffsetX =
					-(offset[0] - 5.91) - playerPositionRoom * CORRIDOR_LENGTH;
			}

			const monsterZ = Math.abs(startZ);
			const playerZ = Math.abs(targetZ);
			const monsterX = startX;
			const playerX = targetX;

			const path = [{ x: startX, z: startZ, cost: 1, weight: 1 }];

			const getWaypointKey = (x, z, type = 'z') => {
				return `${type}_${x.toFixed(2)}_${z.toFixed(2)}`;
			};

			const isWaypointVisited = (x, z, type = 'z') => {
				const key = getWaypointKey(x, z, type);
				return visitedWaypoints[key] === true;
			};

			if (isRaidMode) {
				if (monsterZ < 1.4 && playerZ > 1.4) {
					const corridorWall = WALL_OPENINGS.find(
						(wall) => wall.zPosition === 1.4
					);
					const corridorWaypointX = corridorWall.getOpeningX(
						roomOffsetX,
						isBottomRow
					);
					let corridorWaypointZ = 1.4;

					if (isBottomRow) {
						corridorWaypointZ = -corridorWaypointZ;
					}

					if (!isWaypointVisited(corridorWaypointX, corridorWaypointZ, 'z')) {
						path.push({
							x: corridorWaypointX,
							z: corridorWaypointZ,
							cost: 1,
							weight: 1,
						});
					}

					for (const wall of WALL_OPENINGS) {
						if (wall.type === 'z' && wall.zPosition > 1.4) {
							const wallZ = wall.zPosition;

							if (playerZ > wallZ) {
								let waypointX = wall.getOpeningX(roomOffsetX, isBottomRow);
								let waypointZ = wallZ;

								if (isBottomRow) {
									waypointZ = -waypointZ;
								}

								if (!isWaypointVisited(waypointX, waypointZ, 'z')) {
									path.push({ x: waypointX, z: waypointZ, cost: 1, weight: 1 });
								}
							}
						}
					}

					const playerInZone = Math.abs(targetZ) < 4.2;
					if (playerInZone) {
						const wallX = -1.35 + roomOffsetX + 2.92;
						const playerInBathroom = isBottomRow
							? playerX > wallX
							: playerX < wallX;

						if (playerInBathroom) {
							const xWall = WALL_OPENINGS.find((wall) => wall.type === 'x');
							if (xWall) {
								let xWaypointX = xWall.getWaypointX(roomOffsetX, isBottomRow);
								let xWaypointZ = xWall.getWaypointZ();
								if (isBottomRow) {
									xWaypointZ = -xWaypointZ;
								}

								if (!isWaypointVisited(xWaypointX, xWaypointZ, 'x')) {
									path.push({
										x: xWaypointX,
										z: xWaypointZ,
										cost: 1,
										weight: 1,
									});
								}
							}
						}
					}

					return path;
				}
			}

			if (Math.abs(targetZ) < 1.4) {
				if (monsterZ > 1.4) {
					const corridorWall = WALL_OPENINGS.find(
						(wall) => wall.zPosition === 1.4
					);
					const corridorWaypointX = corridorWall.getOpeningX(
						roomOffsetX,
						isBottomRow
					);
					let corridorWaypointZ = 1.4;

					if (isBottomRow) {
						corridorWaypointZ = -corridorWaypointZ;
					}

					if (!isWaypointVisited(corridorWaypointX, corridorWaypointZ, 'z')) {
						path.push({
							x: corridorWaypointX,
							z: corridorWaypointZ,
							cost: 1,
							weight: 1,
						});
					}
				}
				return path;
			}

			let hasZWaypoint = false;

			if (monsterZ > 1.4 && monsterZ < 4.4) {
				for (const wall of WALL_OPENINGS) {
					if (wall.type === 'x') {
						const monsterInZone = Math.abs(startZ) < 4.2;
						const playerInZone = Math.abs(targetZ) < 4.2;

						if (monsterInZone || playerInZone) {
							const wallX = wall.xPosition + roomOffsetX + 2.92;
							const playerInBathroom = playerX < wallX;
							const monsterInBathroom = monsterX < wallX;

							const needsXWaypoint =
								(playerInBathroom && !monsterInBathroom) ||
								(!playerInBathroom && monsterInBathroom);

							let expectedXWaypointX = wall.getWaypointX(
								roomOffsetX,
								isBottomRow
							);
							let expectedXWaypointZ = wall.getWaypointZ();
							if (isBottomRow) {
								expectedXWaypointZ = -expectedXWaypointZ;
							}

							const distanceToXWaypoint = Math.sqrt(
								Math.pow(monsterX - expectedXWaypointX, 2) +
									Math.pow(startZ - expectedXWaypointZ, 2)
							);
							const isAtXWaypoint = distanceToXWaypoint < 0.2;

							if (
								needsXWaypoint &&
								!isAtXWaypoint &&
								!isWaypointVisited(expectedXWaypointX, expectedXWaypointZ, 'x')
							) {
								path.push({
									x: expectedXWaypointX,
									z: expectedXWaypointZ,
									cost: 1,
									weight: 1,
								});

								return path;
							}
						}
					}
				}
			}

			for (const wall of WALL_OPENINGS) {
				if (wall.type === 'z') {
					const wallZ = wall.zPosition;

					const monsterBeyondWall = monsterZ > wallZ;
					const playerBeforeWall = playerZ < wallZ;
					const monsterBeforeWall = monsterZ < wallZ;
					const playerBeyondWall = playerZ > wallZ;

					const needsWaypoint =
						(monsterBeyondWall && playerBeforeWall) ||
						(monsterBeforeWall && playerBeyondWall);

					if (wallZ === 1.4 && Math.abs(targetZ) < 1.4 && !needsWaypoint) {
						continue;
					}

					if (needsWaypoint) {
						let waypointX = wall.getOpeningX(roomOffsetX, isBottomRow);
						let waypointZ = wallZ;

						if (isBottomRow) {
							waypointZ = -waypointZ;
						}

						if (!isWaypointVisited(waypointX, waypointZ, 'z')) {
							path.push({ x: waypointX, z: waypointZ, cost: 1, weight: 1 });
							hasZWaypoint = true;
						}
					}
				}
			}

			if (!hasZWaypoint) {
				for (const wall of WALL_OPENINGS) {
					if (wall.type === 'x') {
						const monsterInZone = Math.abs(startZ) < 4.2;
						const playerInZone = Math.abs(targetZ) < 4.2;

						if (monsterInZone || playerInZone) {
							const wallX = wall.xPosition + roomOffsetX + 2.92;

							const monsterBeyondWall = monsterX > wallX;
							const playerBeforeWall = playerX < wallX;
							const monsterBeforeWall = monsterX < wallX;
							const playerBeyondWall = playerX > wallX;

							const needsXWaypoint =
								(monsterBeyondWall && playerBeforeWall) ||
								(monsterBeforeWall && playerBeyondWall);

							if (needsXWaypoint) {
								let waypointX = wall.getWaypointX(roomOffsetX, isBottomRow);
								let waypointZ = wall.getWaypointZ();

								if (isBottomRow) {
									waypointZ = -waypointZ;
								}

								if (!isWaypointVisited(waypointX, waypointZ, 'x')) {
									path.push({ x: waypointX, z: waypointZ, cost: 1, weight: 1 });
								}
							}
						}
					}
				}
			}

			return path;
		},
		[]
	);

	return {
		findPath,
		isWorkerReady: true,
	};
};

export default useSimplePathfinding;
