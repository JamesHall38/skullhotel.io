import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { seed, roomNumber, events } from '../utils/config';
import useHiding from './useHiding';
import useInterface from './useInterface';
import useMonster from './useMonster';
import useDoor from './useDoor';
import useGridStore from './useGrid';

const CORRIDORLENGTH = 5.95;

const useGameStore = create(
	subscribeWithSelector((set, get) => ({
		seedData: seed,
		eventData: events,
		deaths: 0,

		setSeedData: (newSeedData) => {
			set({ seedData: newSeedData });
		},

		openDeathScreen: false,
		setOpenDeathScreen: (state) => set(() => ({ openDeathScreen: state })),

		loading: true,
		setLoading: (state) => set(() => ({ loading: state })),

		isMobile: false,
		setIsMobile: (value) => set({ isMobile: value }),

		deviceMode: 'keyboard',
		setDeviceMode: (mode) => set(() => ({ deviceMode: mode })),

		isLocked: false,
		setIsLocked: (locked) => set({ isLocked: locked }),

		end: false,
		setEnd: (state) => set(() => ({ end: state })),

		isFlickering: false,
		setIsFlickering: (state) => set(() => ({ isFlickering: state })),

		resetFootstepSound: true,
		setResetFootstepSound: (state) =>
			set(() => ({ resetFootstepSound: state })),

		// Animation d'intro
		playIntro: false,
		setPlayIntro: (value) => set({ playIntro: value }),

		// Room
		roomTotal: roomNumber,
		realPlayerPositionRoom: null,
		setRealPlayerPositionRoom: (position) =>
			set(() => ({ realPlayerPositionRoom: position })),
		playerPositionRoom: null,
		setPlayerPositionRoom: (position) =>
			set(() => ({ playerPositionRoom: position })),
		activeRadios: [],
		setActiveRadios: (radio) =>
			set((state) => {
				if (radio === null) return { activeRadios: [] };
				const newActiveRadios = [...state.activeRadios];
				const index = newActiveRadios.indexOf(radio);
				if (index !== -1) {
					newActiveRadios.splice(index, 1);
				} else {
					newActiveRadios.push(radio);
				}
				return { activeRadios: newActiveRadios };
			}),
		activeTvs: [],
		setActiveTvs: (tv) =>
			set((state) => {
				if (tv === null) return { activeTvs: [] };
				const newActiveTvs = [...state.activeTvs];
				const index = newActiveTvs.indexOf(tv);
				if (index !== -1) {
					newActiveTvs.splice(index, 1);
				} else {
					newActiveTvs.push(tv);
				}
				return { activeTvs: newActiveTvs };
			}),

		// Camera Shaking
		shakeIntensity: 0,
		setShakeIntensity: (intensity) =>
			set(() => ({ shakeIntensity: intensity })),

		// Lights
		roomLight: false,
		setRoomLight: (state) => set(() => ({ roomLight: state })),
		bathroomLight: false,
		setBathroomLight: (state) => set(() => ({ bathroomLight: state })),

		// Events
		tv: false,
		setTv: (state) => set(() => ({ tv: state })),
		radio: false,
		setRadio: (state) => set(() => ({ radio: state })),

		// Objectives
		isPlayerHidden: (camera) => {
			const doors = useDoor.getState();
			const hiding = useHiding.getState();
			const hideSpot = hiding.hideSpot;
			const getCell = useGridStore.getState().getCell;

			// Si on n'a pas de hideSpot défini, le joueur n'est pas caché
			if (!hideSpot || !camera) return false;

			// Convertir la position de la caméra en position de grille
			const GRID_OFFSET_X = 600;
			const GRID_OFFSET_Z = 150;
			const playerX = Math.floor(camera.position.x * 10 + GRID_OFFSET_X);
			const playerZ = Math.floor(camera.position.z * 10 + GRID_OFFSET_Z);

			// Récupérer la cellule actuelle
			const currentCell = getCell(playerX, playerZ);

			// Vérifier si on est dans une cachette
			let isHidden = false;
			let hidingSpotName = '';

			switch (hideSpot) {
				case 'roomCurtain':
					isHidden =
						currentCell.hidingSpot === 'room_curtain' && !doors.roomCurtain;
					hidingSpotName = 'rideau de la chambre';
					break;
				case 'bathroomCurtain':
					isHidden =
						currentCell.hidingSpot === 'bathroom_curtain' &&
						!doors.bathroomCurtain;
					hidingSpotName = 'rideau de la salle de bain';
					break;
				case 'desk':
					isHidden = currentCell.hidingSpot === 'desk' && !doors.desk;
					hidingSpotName = 'bureau';
					break;
				case 'nightstand':
					isHidden =
						currentCell.hidingSpot === 'nightstand' && !doors.nightStand;
					hidingSpotName = 'table de nuit';
					break;
				default:
					isHidden = false;
			}

			if (isHidden) {
				console.log(`Caché dans : ${hidingSpotName}`);
			}

			return isHidden;
		},

		checkObjectiveCompletion: (objective, room) => {
			const state = get();
			const roomData = state.seedData[`empty_${room}`];

			if (roomData?.hideObjective === objective) {
				const hiding = useHiding.getState();
				const monster = useMonster.getState();
				const doors = useDoor.getState();

				// Calculer la position du monstre au milieu de la room
				let monsterX;
				if (room >= roomNumber / 2) {
					monsterX = -(room - roomNumber / 2) * CORRIDORLENGTH;
				} else {
					monsterX = -room * CORRIDORLENGTH;
				}

				// Positionner le monstre dans la room
				monster.setMonsterPosition([monsterX, 0, 0]);
				monster.setMonsterRotation([0, 0, 0]);

				// Si la porte est ouverte, le monstre attaque directement
				if (doors.roomDoor[room]) {
					monster.setMonsterState('run');
					monster.playAnimation('Run');
					monster.setAnimationSpeed(1);
				} else {
					// Sinon, il toque à la porte
					hiding.setMonsterKnocking(true);
					hiding.setKnockingRoom(room);
					hiding.setHideSpot(roomData.hideSpot);

					// Start a timer for the monster to enter
					setTimeout(() => {
						const hiding = useHiding.getState();
						const monster = useMonster.getState();
						const doors = useDoor.getState();
						if (hiding.isMonsterKnocking) {
							// Ouvrir la porte
							doors.setRoomDoor(room, true);

							// Attendre un peu que la porte s'ouvre avant que le monstre n'entre
							setTimeout(() => {
								hiding.setMonsterKnocking(false);
								hiding.setMonsterEntering(true);
								monster.setMonsterState('run');
								monster.playAnimation('Run');
								monster.setAnimationSpeed(1);
							}, 1000); // Attendre 1 seconde après l'ouverture de la porte
						}
					}, 10000); // 10 seconds to hide
				}
			}
		},

		restart: () => {
			set((state) => ({
				// seedData: seed, // commented for easy debug but should be uncommented for production
				eventData: events,
				deaths: state.deaths + 1,
				roomTotal: roomNumber,
				playerPositionRoom: null,
				resetFootstepSound: true,
				cameraShakingWhenLookingAtMonster: false,
				shakeIntensity: 0,
				roomLight: false,
				bathroomLight: false,
				activeRadios: [],
				activeTvs: [],
				playIntro: false,
			}));
			useHiding.getState().restart();
		},
	}))
);

// Surveiller les changements dans interfaceObjectives
useInterface.subscribe(
	(state) => state.interfaceObjectives,
	(interfaceObjectives) => {
		const gameState = useGameStore.getState();
		const roomNumber = gameState.playerPositionRoom;
		if (roomNumber === null) return;

		const objectives = interfaceObjectives[roomNumber];
		if (!objectives) return;

		// Vérifier chaque objectif
		if (objectives[0]) {
			// bottles
			gameState.checkObjectiveCompletion('bottles', roomNumber);
		}
		if (objectives[1]) {
			// bedsheets
			gameState.checkObjectiveCompletion('bedsheets', roomNumber);
		}
		if (objectives[2]) {
			// window
			gameState.checkObjectiveCompletion('window', roomNumber);
		}
	}
);

export default useGameStore;
