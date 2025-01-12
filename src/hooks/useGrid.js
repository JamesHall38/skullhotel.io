import { create } from 'zustand';
import useGame from './useGame';

export const CELL_TYPES = {
	EMPTY: 'empty',
	WALL: 'wall',
	RAISED_AREA_LOW: 'raised_area_low',
	RAISED_AREA_HIGH: 'raised_area_high',
	CROUCH_ONLY: 'crouch_only',
	DOOR: 'door',
	ROOM_DOOR_CLOSED: 'roomDoorClosed',
	ROOM_DOOR_OPEN: 'roomDoorOpen',
	BATHROOM_DOOR_CLOSED: 'bathroomDoorClosed',
	BATHROOM_DOOR_OPEN: 'bathroomDoorOpen',
	ROOM_CURTAIN_CLOSED: 'roomCurtainClosed',
	BATHROOM_CURTAIN_CLOSED: 'bathroomCurtainClosed',
	DESK_DOOR_CLOSED: 'deskDoorClosed',
	DESK_DOOR_OPEN: 'deskDoorOpen',
	NIGHTSTAND_DOOR_CLOSED: 'nightstandDoorClosed',
	NIGHTSTAND_DOOR_OPEN: 'nightstandDoorOpen',
	BED: 'bed',
	TUTORIAL_DOOR_CLOSED: 'tutorialRoomDoorClosed',
	TUTORIAL_DOOR_OPEN: 'tutorialRoomDoorOpen',
	EXIT_DOOR_CLOSED: 'exitDoorClosed',
	CORRIDOR_DOOR_CLOSED: 'corridorRoomDoorClosed',
	CORRIDOR_DOOR_OPEN: 'corridorRoomDoorOpen',
	MONSTER_POSITION: 'monsterPosition',
};

const useGridStore = create((set, get) => ({
	grid: {},
	gridSize: { width: 750, height: 300 },
	isInitialized: false,

	initialWalls: [
		// Reception
		{ start: { x: 733, z: 112 }, end: { x: 735, z: 185 } }, // left wall
		{ start: { x: 713, z: 112 }, end: { x: 735, z: 114 } }, // door left
		{ start: { x: 680, z: 183 }, end: { x: 735, z: 185 } }, // reception wall
		{ start: { x: 680, z: 112 }, end: { x: 701, z: 114 } }, // door right
		{ start: { x: 680, z: 112 }, end: { x: 680, z: 139 } }, // right corner
		{ start: { x: 664, z: 160 }, end: { x: 680, z: 185 } }, // left corner
		{
			start: { x: 640, z: 139 },
			end: { x: 680, z: 139 },
		}, // corridor left

		{
			start: { x: 701, z: 112 },
			end: { x: 713, z: 114 },
			type: CELL_TYPES.EXIT_DOOR_CLOSED,
		},
		{
			start: { x: 654, z: 180 },
			end: { x: 664, z: 184 },
			type: CELL_TYPES.TUTORIAL_DOOR_CLOSED,
		},
		{
			start: { x: 664, z: 183 },
			end: { x: 667, z: 196 },
			type: CELL_TYPES.TUTORIAL_DOOR_OPEN,
		},
		{
			start: { x: 637, z: 145 },
			end: { x: 640, z: 155 },
			type: CELL_TYPES.CORRIDOR_DOOR_CLOSED,
		},
		{
			start: { x: 625, z: 155 },
			end: { x: 637, z: 158 },
			type: CELL_TYPES.CORRIDOR_DOOR_OPEN,
		},

		{ start: { x: 640, z: 160 }, end: { x: 654, z: 185 } }, // tutorial right
		{ start: { x: 637, z: 137 }, end: { x: 640, z: 144 } }, // door right
		{ start: { x: 637, z: 155 }, end: { x: 640, z: 162 } }, // door left
		{
			start: { x: 615, z: 163 },
			end: { x: 638, z: 164 },
		}, // corridor left first wall

		{ start: { x: 688, z: 161 }, end: { x: 726, z: 172 } }, // reception desk
		{ start: { x: 705, z: 171 }, end: { x: 710, z: 176 } }, // receptionnist

		{ start: { x: 24, z: 135 }, end: { x: 50, z: 136 } }, // corridor end right
		{ start: { x: 23, z: 135 }, end: { x: 24, z: 162 } }, // corridor end
	],

	generateRooms: () => {
		const seedData = useGame.getState().seedData;

		const closedDoorPositions = [
			{
				start: { x: 28, z: 21 },
				end: { x: 32, z: 25 },
				type: CELL_TYPES.BATHROOM_DOOR_CLOSED,
			},
			{
				start: { x: 21, z: 26 },
				end: { x: 27, z: 28 },
				type: CELL_TYPES.BATHROOM_DOOR_OPEN,
			},
			{
				start: { x: 50, z: 51 },
				end: { x: 53, z: 53 },
				type: CELL_TYPES.DESK_DOOR_CLOSED,
			},
			{
				start: { x: 4, z: 34 },
				end: { x: 7, z: 37 },
				type: CELL_TYPES.NIGHTSTAND_DOOR_CLOSED,
			},
			{
				start: { x: 4, z: 8 },
				end: { x: 15, z: 13 },
				type: CELL_TYPES.BATHROOM_CURTAIN_CLOSED,
			},
			{
				start: { x: 21, z: 99 },
				end: { x: 37, z: 102 },
				type: CELL_TYPES.ROOM_CURTAIN_CLOSED,
			},
		];

		// Zones de cachette séparées
		const hidingSpots = [
			{
				start: { x: 21, z: 103 },
				end: { x: 37, z: 104 },
				type: CELL_TYPES.EMPTY,
				hidingSpot: 'room_curtain',
			},
			{
				start: { x: 4, z: 5 },
				end: { x: 15, z: 7 },
				type: CELL_TYPES.EMPTY,
				hidingSpot: 'bathroom_curtain',
			},
			{
				start: { x: 54, z: 51 },
				end: { x: 55, z: 53 },
				type: CELL_TYPES.CROUCH_ONLY,
				hidingSpot: 'desk',
			},
			{
				start: { x: 2, z: 34 },
				end: { x: 4, z: 37 },
				type: CELL_TYPES.CROUCH_ONLY,
				hidingSpot: 'nightstand',
			},
		];

		const baseRoom = [
			// Walls
			{ start: { x: 49, z: 0 }, end: { x: 59, z: 4 } }, // door left
			{ start: { x: 0, z: 0 }, end: { x: 40, z: 4 } }, // door right
			{ start: { x: 56, z: 0 }, end: { x: 59, z: 102 } }, //left wall
			{ start: { x: 0, z: 25 }, end: { x: 1, z: 102 } }, // right wall
			{
				start: { x: 2, z: 40 },
				end: { x: 20, z: 58 },
				type: CELL_TYPES.BED,
			}, // bed
			{ start: { x: 2, z: 57 }, end: { x: 5, z: 63 } }, // left nightstand
			{ start: { x: 2, z: 37 }, end: { x: 7, z: 41 } }, // right nightstand
			{
				start: { x: 2, z: 25 },
				end: { x: 7, z: 37 },
				type: CELL_TYPES.CROUCH_ONLY,
			}, // right nightstand
			{ start: { x: 44, z: 61 }, end: { x: 59, z: 65 } }, // left reinforcement
			{ start: { x: 0, z: 64 }, end: { x: 24, z: 68 } }, // right reinforcement
			{ start: { x: 47, z: 89 }, end: { x: 59, z: 102 } }, // corner
			{ start: { x: 38, z: 99 }, end: { x: 59, z: 106 } }, // window left
			{ start: { x: 0, z: 99 }, end: { x: 20, z: 106 } }, // window right
			{ start: { x: 20, z: 105 }, end: { x: 38, z: 106 } }, // window

			// Bathroom
			{ start: { x: 28, z: 0 }, end: { x: 32, z: 20 } }, // switch
			{ start: { x: 28, z: 26 }, end: { x: 32, z: 33 } }, // corner
			{ start: { x: 0, z: 29 }, end: { x: 32, z: 33 } }, // wall
			{ start: { x: 0, z: 0 }, end: { x: 3, z: 29 } }, // mirror
			{ start: { x: 16, z: 0 }, end: { x: 32, z: 13 } }, // towel rail
			{
				start: { x: 4, z: 24 },
				end: { x: 7, z: 28 },
				type: CELL_TYPES.RAISED_AREA_HIGH,
			}, // toilets
			{
				start: { x: 4, z: 8 },
				end: { x: 15, z: 13 },
				type: CELL_TYPES.RAISED_AREA_LOW,
			}, // bath

			// desk
			{
				start: { x: 50, z: 36 },
				end: { x: 55, z: 58 },
				type: CELL_TYPES.CROUCH_ONLY,
			},
			{ start: { x: 50, z: 36 }, end: { x: 55, z: 38 } },
			{ start: { x: 50, z: 48 }, end: { x: 55, z: 50 } },
			{ start: { x: 48, z: 41 }, end: { x: 53, z: 45 } }, // chair
			{ start: { x: 50, z: 54 }, end: { x: 55, z: 58 } },

			// Living Room
			{
				start: { x: 47, z: 66 },
				end: { x: 53, z: 88 },
				type: CELL_TYPES.RAISED_AREA_LOW,
			}, // couch
			{
				start: { x: 53, z: 66 },
				end: { x: 55, z: 88 },
				type: CELL_TYPES.RAISED_AREA_HIGH,
			}, // couch longue
			{
				start: { x: 48, z: 66 },
				end: { x: 55, z: 68 },
				type: CELL_TYPES.RAISED_AREA_HIGH,
			}, // armchair left
			{
				start: { x: 48, z: 72 },
				end: { x: 55, z: 76 },
				type: CELL_TYPES.RAISED_AREA_HIGH,
			}, // armchair right
			{
				start: { x: 35, z: 74 },
				end: { x: 41, z: 86 },
				type: CELL_TYPES.RAISED_AREA_LOW,
			}, // table
			{ start: { x: 0, z: 68 }, end: { x: 5, z: 102 } }, // tv
			{
				start: { x: 33, z: 8 },
				end: { x: 34, z: 14 },
				type: CELL_TYPES.RAISED_AREA_LOW,
			}, // wardrobe

			...closedDoorPositions,
			...hidingSpots, // Ajout des zones de cachette
		];

		const roomWidth = 59;
		const roomHeight = 100;
		const gap = 0;
		const rooms = [];

		const startX = 20;
		const startZ = 162;
		const roomsPerRow = 10;
		// const roomsPerRow = 1;
		const adjustEveryXRooms = 2;
		const adjustment = 1;

		const tutorialRoomX = 615;
		const tutorialRoomZ = 180;
		baseRoom.forEach((wall) => {
			const newWall = {
				start: {
					x: Math.round(wall.start.x + tutorialRoomX),
					z: Math.round(wall.start.z + tutorialRoomZ),
				},
				end: {
					x: Math.round(wall.end.x + tutorialRoomX),
					z: Math.round(wall.end.z + tutorialRoomZ),
				},
				type: wall.type,
				hidingSpot: wall.hidingSpot,
			};
			rooms.push(newWall);
		});

		for (let row = 0; row < 2; row++) {
			for (let col = 0; col < roomsPerRow; col++) {
				const roomIndex = row * roomsPerRow + col + 1;
				const extraOffset = Math.floor(col / adjustEveryXRooms) * adjustment;
				const offsetX =
					startX + col * (roomWidth + gap) + extraOffset + (row === 0 ? 0 : 0);
				const offsetZ = startZ + row * (roomHeight + gap) + (row === 0 ? 1 : 4);
				const isTopRow = row === 0;

				const roomDoorClosed = {
					start: { x: 41, z: 0 },
					end: { x: 48, z: 4 },
					type: CELL_TYPES.ROOM_DOOR_CLOSED,
					roomIndex,
				};

				baseRoom.push(roomDoorClosed);

				const roomDoorOpen = {
					start: { x: 49, z: 5 },
					end: { x: 52, z: 16 },
					type: CELL_TYPES.ROOM_DOOR_OPEN,
					roomIndex: 0,
				};

				baseRoom.push(roomDoorOpen);

				baseRoom.forEach((wall) => {
					let newWall;
					if (isTopRow) {
						newWall = {
							start: {
								x: Math.round(wall.start.x + offsetX),
								z: Math.round(wall.start.z + offsetZ),
							},
							end: {
								x: Math.round(wall.end.x + offsetX),
								z: Math.round(wall.end.z + offsetZ),
							},
							type: wall.type,
							hidingSpot: wall.hidingSpot,
						};
					} else {
						newWall = {
							start: {
								x: Math.round(roomWidth - wall.end.x + offsetX + 30),
								z: Math.round(roomHeight - wall.end.z + offsetZ - 230),
							},
							end: {
								x: Math.round(roomWidth - wall.start.x + offsetX + 30),
								z: Math.round(roomHeight - wall.start.z + offsetZ - 230),
							},
							type: wall.type,
							hidingSpot: wall.hidingSpot,
						};
					}
					rooms.push(newWall);
				});

				const seedDataArray = Object.values(seedData);
				const monsterRoomIndex = isTopRow
					? roomsPerRow - col
					: Math.floor(seedDataArray.length / 2) + (roomsPerRow - col);
				const roomData = seedDataArray[monsterRoomIndex - 1];

				if (roomData?.monsterInitialPosition) {
					const monsterX = Math.round(
						(roomData.monsterInitialPosition[0] * 18 + roomWidth) / 2 - 15
					);
					const monsterZ = Math.round(
						(roomData.monsterInitialPosition[2] * 18 + roomHeight) / 2
					);

					if (isTopRow) {
						const finalPos = {
							x: Math.round(monsterX + offsetX),
							z: Math.round(monsterZ + offsetZ),
						};

						const newWall = {
							start: {
								x: finalPos.x,
								z: finalPos.z,
							},
							end: {
								x: finalPos.x,
								z: finalPos.z,
							},
							type: CELL_TYPES.MONSTER_POSITION,
							roomIndex,
						};
						rooms.push(newWall);
					} else {
						const finalPos = {
							x: Math.round(roomWidth - monsterX + offsetX + 30),
							z: Math.round(roomHeight - monsterZ + offsetZ - 230),
						};

						const newWall = {
							start: {
								x: finalPos.x,
								z: finalPos.z,
							},
							end: {
								x: finalPos.x,
								z: finalPos.z,
							},
							type: CELL_TYPES.MONSTER_POSITION,
							roomIndex,
						};
						rooms.push(newWall);
					}
				}
			}
		}

		return rooms;
	},

	initializeGrid: () => {
		if (get().isInitialized) return;

		const { width, height } = get().gridSize;
		const walls = [...get().initialWalls, ...get().generateRooms()];
		const newGrid = {};

		// Initialiser la grille de base
		for (let x = 0; x < width; x++) {
			for (let z = 0; z < height; z++) {
				newGrid[`${x},${z}`] = {
					type: CELL_TYPES.EMPTY,
					x,
					z,
					boundary: x === 0 || x === width - 1 || z === 0 || z === height - 1,
				};
			}
		}

		walls.forEach((wall) => {
			for (let x = wall.start.x; x <= wall.end.x; x++) {
				for (let z = wall.start.z; z <= wall.end.z; z++) {
					newGrid[`${x},${z}`] = {
						...newGrid[`${x},${z}`],
						type: wall.type || CELL_TYPES.WALL,
						hidingSpot: wall.hidingSpot || null,
					};
				}
			}
		});

		set({ grid: newGrid, isInitialized: true });
		// get().printGridASCII();
	},

	getCell: (x, z) => {
		return (
			get().grid[`${x},${z}`] || {
				type: CELL_TYPES.EMPTY,
				x,
				z,
				boundary: false,
			}
		);
	},

	setCellType: (x, z, type) => {
		set((state) => ({
			grid: {
				...state.grid,
				[`${x},${z}`]: { ...state.grid[`${x},${z}`], type },
			},
		}));
	},

	getAllWalls: () => {
		return Object.values(get().grid).filter(
			(cell) => cell.type === CELL_TYPES.WALL
		);
	},

	getAllBoundaries: () => {
		return Object.values(get().grid).filter((cell) => cell.boundary);
	},

	printGridASCII: () => {
		const { width, height } = get().gridSize;
		let asciiGrid = '';
		const heightScaleFactor = 2;
		const widthScaleFactor = 4;
		const scaledHeight = Math.ceil(height / heightScaleFactor);
		const scaledWidth = Math.ceil(width / widthScaleFactor);

		const brightGreen = '\x1b[92m■\x1b[0m'; // Bright green
		const darkGreen = '\x1b[32m■\x1b[0m'; // Dark green
		const mediumGreen = '\x1b[32;1m■\x1b[0m'; // Medium green
		const cyan = '\x1b[36m■\x1b[0m'; // Cyan
		const darkGreenDoor = '\x1b[32m■\x1b[0m'; // Dark green
		const redMonster = '\x1b[31m██\x1b[0m'; // Bright red
		const brightCyan = '\x1b[36;1m■\x1b[0m'; // Bright cyan
		const magentaHiding = '\x1b[35m■\x1b[0m'; // Magenta pour les cachettes

		asciiGrid +=
			'   0                       50                      100                      150                      200                      250                      300';
		asciiGrid += '\n';
		asciiGrid += '\n';

		for (let x = scaledWidth - 1; x >= 0; x--) {
			asciiGrid += (x * widthScaleFactor).toString().padStart(3, ' ') + '|';
			for (let z = 0; z < scaledHeight; z++) {
				let hasWall = false;
				let hasLowArea = false;
				let hasHighArea = false;
				let hasBoundary = false;
				let hasCrouchOnly = false;
				let hasDoor = false;
				let hasOpenDoor = false;
				let hasBed = false;
				let hasHidingSpot = false;

				let hasMonsterTopLeft = false;
				let hasMonsterTopRight = false;
				let hasMonsterBottomLeft = false;
				let hasMonsterBottomRight = false;

				for (let dx = 0; dx < widthScaleFactor; dx++) {
					for (let dz = 0; dz < heightScaleFactor; dz++) {
						const cell = get().getCell(
							x * widthScaleFactor + dx,
							z * heightScaleFactor + dz
						);
						// Log les cellules avec hidingSpot
						if (cell.hidingSpot) {
							hasHidingSpot = true;
						} else if (cell.type === CELL_TYPES.MONSTER_POSITION) {
							hasMonsterTopLeft = true;
							hasMonsterTopRight = true;
							hasMonsterBottomLeft = true;
							hasMonsterBottomRight = true;
						} else if (cell.type === CELL_TYPES.WALL) {
							hasWall = true;
						} else if (cell.type === CELL_TYPES.RAISED_AREA_LOW) {
							hasLowArea = true;
						} else if (cell.type === CELL_TYPES.RAISED_AREA_HIGH) {
							hasHighArea = true;
						} else if (cell.type === CELL_TYPES.CROUCH_ONLY) {
							hasCrouchOnly = true;
						} else if (
							cell.type === CELL_TYPES.ROOM_DOOR_CLOSED ||
							cell.type === CELL_TYPES.BATHROOM_DOOR_CLOSED ||
							cell.type === CELL_TYPES.ROOM_CURTAIN_CLOSED ||
							cell.type === CELL_TYPES.BATHROOM_CURTAIN_CLOSED ||
							cell.type === CELL_TYPES.DESK_DOOR_CLOSED ||
							cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED ||
							cell.type === CELL_TYPES.TUTORIAL_DOOR_CLOSED ||
							cell.type === CELL_TYPES.EXIT_DOOR_CLOSED ||
							cell.type === CELL_TYPES.CORRIDOR_DOOR_CLOSED
						) {
							hasDoor = true;
						} else if (
							cell.type === CELL_TYPES.ROOM_DOOR_OPEN ||
							cell.type === CELL_TYPES.BATHROOM_DOOR_OPEN ||
							cell.type === CELL_TYPES.DESK_DOOR_OPEN ||
							cell.type === CELL_TYPES.NIGHTSTAND_DOOR_OPEN ||
							cell.type === CELL_TYPES.TUTORIAL_DOOR_OPEN ||
							cell.type === CELL_TYPES.EXIT_DOOR_OPEN ||
							cell.type === CELL_TYPES.CORRIDOR_DOOR_OPEN
						) {
							hasOpenDoor = true;
						} else if (cell.boundary) {
							hasBoundary = true;
						} else if (cell.type === CELL_TYPES.BED) {
							hasBed = true;
						}
					}
				}

				if (
					hasMonsterTopLeft ||
					hasMonsterTopRight ||
					hasMonsterBottomLeft ||
					hasMonsterBottomRight
				) {
					asciiGrid += redMonster;
					z++;
				} else if (hasHidingSpot) {
					asciiGrid += magentaHiding;
				} else if (hasBed) {
					asciiGrid += brightCyan;
				} else if (hasWall) {
					asciiGrid += '█';
				} else if (hasDoor) {
					asciiGrid += cyan;
				} else if (hasOpenDoor) {
					asciiGrid += darkGreenDoor;
				} else if (hasLowArea) {
					asciiGrid += brightGreen;
				} else if (hasHighArea) {
					asciiGrid += darkGreen;
				} else if (hasCrouchOnly) {
					asciiGrid += mediumGreen;
				} else if (hasBoundary) {
					asciiGrid += '▒';
				} else {
					asciiGrid += '·';
				}
			}
			asciiGrid += '\n';
		}

		asciiGrid +=
			'   0                        50                      100                      150                      200                      250                      300';

		console.group('Grid Display');
		console.table(asciiGrid);
		console.groupEnd();
		return asciiGrid;
	},

	initializeIfNeeded: () => {
		const state = get();
		if (!state.isInitialized) {
			state.initializeGrid();
			state.printGridASCII();
		}
	},
}));
//
export default useGridStore;
