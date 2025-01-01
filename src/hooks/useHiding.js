import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import useDoor from './useDoor';
import useGridStore from './useGrid';

const checkIfPlayerIsHidden = (camera) => {
	const doors = useDoor.getState();
	const hiding = useHiding.getState();
	const hideSpot = hiding.hideSpot;
	const getCell = useGridStore.getState().getCell;

	if (!hideSpot || !camera) return false;

	const GRID_OFFSET_X = 600;
	const GRID_OFFSET_Z = 150;
	const playerX = Math.round(camera.position.x * 10 + GRID_OFFSET_X);
	const playerZ = Math.round(camera.position.z * 10 + GRID_OFFSET_Z);

	const currentCell = getCell(playerX, playerZ);

	// Vérifier les cellules adjacentes
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

	console.log('checkIfPlayerIsHidden - Debug:', JSON.stringify({
		playerPosition: { x: playerX, z: playerZ },
		currentCell: {
			type: currentCell?.type,
			hidingSpot: currentCell?.hidingSpot,
			x: currentCell?.x,
			z: currentCell?.z
		},
		surroundingCells: surroundingCells.map(cell => ({
			type: cell?.type,
			hidingSpot: cell?.hidingSpot,
			x: cell?.x,
			z: cell?.z
		})),
		hideSpot,
		doors: {
			roomCurtain: doors.roomCurtain,
			bathroomCurtain: doors.bathroomCurtain,
			desk: doors.desk,
			nightStand: doors.nightStand
		}
	}, null, 2));

	// Vérifier si une des cellules adjacentes est une zone de cachette valide
	const isNearHideSpot = surroundingCells.some(cell =>
		cell?.hidingSpot === 'room_curtain'
	);

	let isHidden = false;
	let hidingSpotName = '';

	switch (hideSpot) {
		case 'roomCurtain':
			isHidden = (currentCell.hidingSpot === 'room_curtain' || isNearHideSpot) && !doors.roomCurtain;
			hidingSpotName = 'rideau de la chambre';
			break;
		case 'bathroomCurtain':
			isHidden = currentCell.hidingSpot === 'bathroom_curtain' && !doors.bathroomCurtain;
			hidingSpotName = 'rideau de la salle de bain';
			break;
		case 'desk':
			isHidden = currentCell.hidingSpot === 'desk' && !doors.desk;
			hidingSpotName = 'bureau';
			break;
		case 'nightstand':
			isHidden = currentCell.hidingSpot === 'nightstand' && !doors.nightStand;
			hidingSpotName = 'table de nuit';
			break;
		default:
			isHidden = false;
	}

	if (isHidden) {
		console.log(`Caché dans : ${hidingSpotName}`);
	}

	return isHidden;
};

const useHiding = create(
	subscribeWithSelector((set) => ({
		isMonsterKnocking: false,
		setMonsterKnocking: (state) => set(() => ({ isMonsterKnocking: state })),

		knockingRoom: null,
		setKnockingRoom: (room) => set(() => ({ knockingRoom: room })),

		isMonsterEntering: false,
		setMonsterEntering: (state) => set(() => ({ isMonsterEntering: state })),

		isPlayerHidden: false,
		setPlayerHidden: (state) => set(() => ({ isPlayerHidden: state })),

		hideSpot: null,
		setHideSpot: (spot) => set(() => ({ hideSpot: spot })),

		checkIfPlayerIsHidden,

		canExitHiding: false,
		setCanExitHiding: (state) => set(() => ({ canExitHiding: state })),

		restart: () => {
			set(() => ({
				isMonsterKnocking: false,
				knockingRoom: null,
				isMonsterEntering: false,
				isPlayerHidden: false,
				hideSpot: null,
				canExitHiding: false,
			}));
		},
	}))
);

export default useHiding;
