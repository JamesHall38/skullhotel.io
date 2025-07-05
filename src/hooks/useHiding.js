import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import useDoor from './useDoor';
import useGridStore from './useGrid';
import useGameplaySettings from './useGameplaySettings';

const checkIfPlayerIsHidden = (camera) => {
	const doors = useDoor.getState();
	const hiding = useHiding.getState();
	const getCell = useGridStore.getState().getCell;
	const roomCount = useGameplaySettings.getState().roomCount;
	const gridOffsetX = roomCount * 29.5 + 10;

	if (!camera) return false;

	const GRID_OFFSET_Z = 150;
	const playerX = Math.round(camera.position.x * 10 + gridOffsetX);
	const playerZ = Math.round(camera.position.z * 10 + GRID_OFFSET_Z);

	const currentCell = getCell(playerX, playerZ);

	const surroundingCells = [
		getCell(playerX - 1, playerZ),
		getCell(playerX + 1, playerZ),
		getCell(playerX, playerZ - 1),
		getCell(playerX, playerZ + 1),
		getCell(playerX - 1, playerZ - 1),
		getCell(playerX + 1, playerZ - 1),
		getCell(playerX - 1, playerZ + 1),
		getCell(playerX + 1, playerZ + 1),
	];

	const isNearRoomCurtain = surroundingCells.some(
		(cell) => cell?.hidingSpot === 'room_curtain'
	);
	const isNearBathroomCurtain = surroundingCells.some(
		(cell) => cell?.hidingSpot === 'bathroom_curtain'
	);
	const isNearDesk = surroundingCells.some(
		(cell) => cell?.hidingSpot === 'desk'
	);
	const isNearNightstand = surroundingCells.some(
		(cell) => cell?.hidingSpot === 'nightstand'
	);

	let isHidden = false;

	if (currentCell.hidingSpot === 'room_curtain' || isNearRoomCurtain) {
		hiding.setHideSpot('roomCurtain');
	} else if (
		currentCell.hidingSpot === 'bathroom_curtain' ||
		isNearBathroomCurtain
	) {
		hiding.setHideSpot('bathroomCurtain');
	} else if (currentCell.hidingSpot === 'desk' || isNearDesk) {
		hiding.setHideSpot('desk');
		hiding.setIsHiddenBehindDesk(!doors.desk);
	} else if (currentCell.hidingSpot === 'nightstand' || isNearNightstand) {
		hiding.setHideSpot('nightstand');
		hiding.setIsHiddenBehindNightstand(!doors.nightStand);
	} else {
		hiding.setHideSpot(null);
		hiding.setIsHiddenBehindDesk(false);
		hiding.setIsHiddenBehindNightstand(false);
	}

	switch (hiding.hideSpot) {
		case 'roomCurtain':
			isHidden = !doors.roomCurtain;
			break;
		case 'bathroomCurtain':
			isHidden = !doors.bathroomCurtain;
			break;
		case 'desk':
			isHidden = !doors.desk;
			break;
		case 'nightstand':
			isHidden = !doors.nightStand;
			break;
		default:
			isHidden = false;
	}

	return isHidden;
};

const useHiding = create(
	subscribeWithSelector((set, get) => ({
		isMonsterKnocking: false,
		setMonsterKnocking: (state) => set(() => ({ isMonsterKnocking: state })),

		knockingRoom: null,
		setKnockingRoom: (room) => set(() => ({ knockingRoom: room })),

		silentKnocking: false,
		setSilentKnocking: (state) => set(() => ({ silentKnocking: state })),

		isMonsterEntering: false,
		setMonsterEntering: (state) => set(() => ({ isMonsterEntering: state })),

		isPlayerHidden: false,
		setPlayerHidden: (state) => set(() => ({ isPlayerHidden: state })),

		hideSpot: null,
		setHideSpot: (spot) => set(() => ({ hideSpot: spot })),

		checkIfPlayerIsHidden,

		canExitHiding: false,
		setCanExitHiding: (state) => set(() => ({ canExitHiding: state })),

		isHiddenBehindDesk: false,
		setIsHiddenBehindDesk: (state) =>
			set(() => ({ isHiddenBehindDesk: state })),

		isHiddenBehindNightstand: false,
		setIsHiddenBehindNightstand: (state) =>
			set(() => ({ isHiddenBehindNightstand: state })),

		hidingStartTime: null,
		setHidingStartTime: (time) => set(() => ({ hidingStartTime: time })),

		unnecessaryFearTriggered: false,
		setUnnecessaryFearTriggered: (state) =>
			set(() => ({ unnecessaryFearTriggered: state })),

		checkUnnecessaryFear: (playerRoom, seedData) => {
			const state = get();

			if (state.isPlayerHidden && !state.unnecessaryFearTriggered) {
				const currentTime = Date.now();

				if (!state.hidingStartTime) {
					set({ hidingStartTime: currentTime });
					return;
				}

				const hidingDuration = currentTime - state.hidingStartTime;

				if (hidingDuration >= 3000) {
					if (
						playerRoom !== null &&
						playerRoom >= 0 &&
						Number.isInteger(playerRoom)
					) {
						const currentRoom = Object.values(seedData)[playerRoom];
						const isRaidRoom =
							currentRoom?.type === 'raid' || currentRoom?.isRaid;

						if (!isRaidRoom) {
							if (window.steamAPI && window.steamAPI.unnecessaryFear) {
								window.steamAPI.unnecessaryFear();
								set({ unnecessaryFearTriggered: true });
							}
						}
					}
				}
			} else if (!state.isPlayerHidden) {
				set({ hidingStartTime: null });
			}
		},

		restart: () => {
			set(() => ({
				isMonsterKnocking: false,
				knockingRoom: null,
				isMonsterEntering: false,
				isPlayerHidden: false,
				hideSpot: null,
				canExitHiding: false,
				isHiddenBehindDesk: false,
				isHiddenBehindNightstand: false,
				silentKnocking: false,
				hidingStartTime: null,
				unnecessaryFearTriggered: false,
			}));
		},
	}))
);

export default useHiding;
