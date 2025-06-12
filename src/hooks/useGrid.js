import { create } from 'zustand';
import useGame from './useGame';
import useGameplaySettings from './useGameplaySettings';

let ROOM_WIDTH = 59;
let START_X = 20;
let START_Z = 162;

export const CELL_TYPES = {
	EMPTY: 'empty',
	WALL: 'wall',
	CEILING: 'ceiling',
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

	isInitialized: false,

	initialWalls: (roomCount) => {
		const baseX = 110 + (roomCount / 2) * 59; // Starting point based on total size

		return [
			// Reception
			{ start: { x: baseX + 33, z: 112 }, end: { x: baseX + 35, z: 185 } }, // left wall
			{ start: { x: baseX + 13, z: 112 }, end: { x: baseX + 35, z: 114 } }, // door left
			{ start: { x: baseX - 20, z: 183 }, end: { x: baseX + 35, z: 185 } }, // reception wall
			{ start: { x: baseX - 20, z: 112 }, end: { x: baseX + 1, z: 114 } }, // door right
			{ start: { x: baseX - 20, z: 112 }, end: { x: baseX - 20, z: 139 } }, // right corner
			{ start: { x: baseX - 38, z: 160 }, end: { x: baseX - 20, z: 185 } }, // left corner

			{
				start: { x: baseX - 70, z: 160 },
				end: { x: baseX - 37, z: 185 },
				type: CELL_TYPES.CEILING,
			}, // left corner

			{
				start: { x: baseX - 60, z: 139 },
				end: { x: baseX - 20, z: 139 },
			}, // corridor left

			{
				start: { x: baseX + 1, z: 112 },
				end: { x: baseX + 13, z: 114 },
				type: CELL_TYPES.EXIT_DOOR_CLOSED,
			},
			{
				start: { x: baseX - 46, z: 180 },
				end: { x: baseX - 36, z: 184 },
				type: CELL_TYPES.TUTORIAL_DOOR_CLOSED,
			},
			{
				start: { x: baseX - 36, z: 183 },
				end: { x: baseX - 33, z: 196 },
				type: CELL_TYPES.TUTORIAL_DOOR_OPEN,
			},
			{
				start: { x: baseX - 63, z: 145 },
				end: { x: baseX - 60, z: 155 },
				type: CELL_TYPES.CORRIDOR_DOOR_CLOSED,
			},
			{
				start: { x: baseX - 75, z: 155 },
				end: { x: baseX - 63, z: 158 },
				type: CELL_TYPES.CORRIDOR_DOOR_OPEN,
			},

			{ start: { x: baseX - 60, z: 160 }, end: { x: baseX - 46, z: 185 } }, // tutorial right
			{ start: { x: baseX - 63, z: 137 }, end: { x: baseX - 60, z: 144 } }, // door right
			{ start: { x: baseX - 63, z: 155 }, end: { x: baseX - 60, z: 162 } }, // door left
			{
				start: { x: baseX - 85, z: 163 },
				end: { x: baseX - 62, z: 164 },
			}, // corridor left first wall

			{ start: { x: baseX - 12, z: 161 }, end: { x: baseX + 26, z: 172 } }, // reception desk

			{ start: { x: 24, z: 135 }, end: { x: 50, z: 136 } }, // corridor end right
			{ start: { x: 23, z: 135 }, end: { x: 24, z: 162 } }, // corridor end
		];
	},

	generateRooms: () => {
		const seedData = useGame.getState().seedData;
		const roomCount = useGameplaySettings.getState().roomCount;
		const baseX = 110 + (roomCount / 2) * 59;

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
			...hidingSpots,
		];

		const roomWidth = 59;
		const roomHeight = 100;
		const gap = 0;
		const rooms = [];

		const roomsPerRow = roomCount / 2;
		const startX = 20;
		const startZ = 162;

		const tutorialRoomX = baseX - 85;
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
				roomType: 'tutorial',
			};
			rooms.push(newWall);
		});

		for (let row = 0; row < 2; row++) {
			for (let col = 0; col < roomsPerRow; col++) {
				const extraOffset = Math.floor(col / 2);
				const offsetX =
					startX + col * (roomWidth + gap) + extraOffset + (row === 0 ? 2 : 1);
				const offsetZ = startZ + row * (roomHeight + gap) + (row === 0 ? 1 : 4);
				const isTopRow = row === 0;

				let roomIndex;
				if (row === 0) {
					roomIndex = col;
				} else {
					roomIndex = roomsPerRow + col;
				}

				const seedDataArray = Object.values(seedData);
				let monsterRoomIndex;
				if (isTopRow) {
					monsterRoomIndex = roomsPerRow - 1 - col;
				} else {
					monsterRoomIndex = seedDataArray.length - 1 - col;
				}
				const roomData = seedDataArray[monsterRoomIndex];

				const roomType = roomData?.type || 'empty';

				const roomDoorClosed = {
					start: { x: 41, z: 0 },
					end: { x: 48, z: 4 },
					type: CELL_TYPES.ROOM_DOOR_CLOSED,
					roomIndex: roomIndex + 1,
					roomType,
				};

				baseRoom.push(roomDoorClosed);

				const roomDoorOpen = {
					start: { x: 49, z: 5 },
					end: { x: 52, z: 16 },
					type: CELL_TYPES.ROOM_DOOR_OPEN,
					roomIndex: 0,
					roomType,
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
							roomType,
							isRaid: roomData?.isRaid,
						};
					} else {
						newWall = {
							start: {
								x: Math.round(roomWidth - wall.end.x + offsetX + 29),
								z: Math.round(roomHeight - wall.end.z + offsetZ - 230),
							},
							end: {
								x: Math.round(roomWidth - wall.start.x + offsetX + 29),
								z: Math.round(roomHeight - wall.start.z + offsetZ - 230),
							},
							type: wall.type,
							hidingSpot: wall.hidingSpot,
							roomType,
							isRaid: roomData?.isRaid,
						};
					}
					rooms.push(newWall);
				});

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
							isRaid: roomData.isRaid,
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
							isRaid: roomData.isRaid,
						};
						rooms.push(newWall);
					}
				}
			}
		}

		return rooms;
	},

	initializeGrid: () => {
		const width = 160 + (useGameplaySettings.getState().roomCount / 2) * 59;
		const height = 300;

		const roomCount = useGameplaySettings.getState().roomCount;
		const walls = [...get().initialWalls(roomCount), ...get().generateRooms()];
		const newGrid = {};

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

		const roomsPerRow = roomCount / 2;
		const roomWidth = 59;
		const roomHeight = 100;
		const startX = 20;
		const startZ = 162;

		const tutorialX = 110 + (roomCount / 2) * 59 - 85;
		const tutorialZ = 180;
		for (let x = tutorialX; x < tutorialX + roomWidth; x++) {
			for (let z = tutorialZ; z < tutorialZ + roomHeight; z++) {
				if (newGrid[`${x},${z}`]) {
					newGrid[`${x},${z}`].roomType = 'tutorial';
				}
			}
		}

		const seedDataArray = Object.values(useGame.getState().seedData);
		for (let row = 0; row < 2; row++) {
			for (let col = 0; col < roomsPerRow; col++) {
				const gap = 0;
				const extraOffset = Math.floor(col / 2);
				const offsetX =
					startX + col * (roomWidth + gap) + extraOffset + (row === 0 ? 2 : 1);
				const offsetZ = startZ + row * (roomHeight + gap) + (row === 0 ? 1 : 4);

				let roomIndex;
				if (row === 0) {
					roomIndex = col;
				} else {
					roomIndex = roomsPerRow + col;
				}

				const roomData = seedDataArray[roomIndex];
				const roomType = roomData?.type || 'empty';

				for (let x = offsetX; x < offsetX + roomWidth; x++) {
					for (let z = offsetZ; z < offsetZ + roomHeight; z++) {
						const cell = newGrid[`${x},${z}`];
						if (cell && !cell.boundary && !cell.type) {
							cell.roomType = roomType;
						}
					}
				}
			}
		}

		walls.forEach((wall) => {
			for (let x = wall.start.x; x <= wall.end.x; x++) {
				for (let z = wall.start.z; z <= wall.end.z; z++) {
					newGrid[`${x},${z}`] = {
						...newGrid[`${x},${z}`],
						type: wall.type || CELL_TYPES.WALL,
						hidingSpot: wall.hidingSpot || null,
						roomType: wall.roomType || newGrid[`${x},${z}`]?.roomType,
						isRaid: wall.isRaid || false,
					};
				}
			}
		});

		set({ grid: newGrid, isInitialized: true });
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
		const width = 160 + (useGameplaySettings.getState().roomCount / 2) * 59;
		const height = 300;

		let asciiGrid = '';
		const heightScaleFactor = 2;
		const widthScaleFactor = 4;
		const scaledHeight = Math.ceil(height / heightScaleFactor);
		const scaledWidth = Math.ceil(width / widthScaleFactor);

		const darkGray = '\x1b[90m■\x1b[0m'; // Dark gray
		const mediumGray = '\x1b[37m■\x1b[0m'; // Medium gray
		const lightGray = '\x1b[97m■\x1b[0m'; // Light gray
		const darkBlue = '\x1b[34m■\x1b[0m'; // Dark blue for doors
		const brightBlue = '\x1b[94m■\x1b[0m'; // Bright blue for open doors
		const redMonster = '\x1b[31m██\x1b[0m'; // Bright red for monster

		const hideoutColor = '\x1b[95m█\x1b[0m'; // Purple for hideout
		const landmineColor = '\x1b[91m█\x1b[0m'; // Red for landmine
		const claymoreColor = '\x1b[93m█\x1b[0m'; // Yellow for claymore
		const hunterColor = '\x1b[33m█\x1b[0m'; // Orange for hunter
		const sonarColor = '\x1b[94m█\x1b[0m'; // Blue for sonar
		const raidColor = '\x1b[92m█\x1b[0m'; // Green for raid
		const emptyColor = '\x1b[90m█\x1b[0m'; // Dark gray for empty
		const tutorialColor = '\x1b[97m█\x1b[0m'; // White for tutorial

		// Légende
		asciiGrid += 'Room Types: ';
		asciiGrid += hideoutColor + ' Hideout  ';
		asciiGrid += landmineColor + ' Landmine  ';
		asciiGrid += claymoreColor + ' Claymore  ';
		asciiGrid += hunterColor + ' Hunter  ';
		asciiGrid += sonarColor + ' Sonar  ';
		asciiGrid += raidColor + ' Raid  ';
		asciiGrid += emptyColor + ' Empty  ';
		asciiGrid += tutorialColor + ' Tutorial\n\n';

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
				let cellRoomType = null;

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
						if (!cellRoomType && cell.roomType) {
							if (cell.roomType === 'raid' && cell.isRaid) {
								cellRoomType = 'raid';
							} else {
								cellRoomType = cell.roomType;
							}
						}
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

				let baseColor = '·';
				switch (cellRoomType) {
					case 'hideout':
						baseColor = hideoutColor;
						break;
					case 'landmine':
						baseColor = landmineColor;
						break;
					case 'claymore':
						baseColor = claymoreColor;
						break;
					case 'hunter':
						baseColor = hunterColor;
						break;
					case 'sonar':
						baseColor = sonarColor;
						break;
					case 'raid':
						baseColor = raidColor;
						break;
					case 'empty':
						baseColor = emptyColor;
						break;
					default:
						baseColor = '·';
				}

				if (
					hasMonsterTopLeft ||
					hasMonsterTopRight ||
					hasMonsterBottomLeft ||
					hasMonsterBottomRight
				) {
					asciiGrid += redMonster;
				} else if (hasWall && !cellRoomType) {
					asciiGrid += '█';
				} else if (hasBed) {
					asciiGrid += darkGray;
				} else if (hasHidingSpot) {
					asciiGrid += mediumGray;
				} else if (hasOpenDoor) {
					asciiGrid += brightBlue;
				} else if (hasDoor) {
					asciiGrid += darkBlue;
				} else if (hasHighArea) {
					asciiGrid += lightGray;
				} else if (hasLowArea) {
					asciiGrid += darkGray;
				} else if (hasCrouchOnly) {
					asciiGrid += mediumGray;
				} else if (hasBoundary) {
					asciiGrid += '▒';
				} else if (cellRoomType === 'tutorial' && hasWall) {
					asciiGrid += '█';
				} else {
					asciiGrid += baseColor;
				}
			}
			asciiGrid += '\n';
		}

		asciiGrid +=
			'   0                        50                      100                      150                      200                      250                      300';

		console.groupCollapsed('Grid Display');
		console.table(asciiGrid);
		console.groupEnd();
		return asciiGrid;
	},

	initializeIfNeeded: () => {
		const state = get();
		state.initializeGrid();

		if (window.location.hash.includes('#debug')) {
			state.printGridASCII();
		}
	},
}));

export { ROOM_WIDTH, START_X, START_Z };
export default useGridStore;
