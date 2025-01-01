import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { seed, roomNumber, events } from '../utils/config';
import useHiding from './useHiding';
import useInterface from './useInterface';
import useMonster from './useMonster';
import useDoor from './useDoor';
import useGrid from './useGrid';

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
		checkObjectiveCompletion: (objective, room, camera) => {
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
					hiding.setMonsterKnocking(true);
					hiding.setKnockingRoom(room);
					hiding.setHideSpot(roomData.hideSpot);

					setTimeout(() => {
						const hiding = useHiding.getState();
						const monster = useMonster.getState();
						let doors = useDoor.getState();

						if (hiding.isMonsterKnocking) {
							doors.setRoomDoor(room, true);

							let checkCount = 0;
							const maxChecks = 5;
							const checkInterval = setInterval(() => {
								const isHidden = useHiding.getState().isPlayerHidden;
								checkCount++;

								if (!isHidden && checkCount >= maxChecks) {
									clearInterval(checkInterval);
									hiding.setMonsterKnocking(false);
									hiding.setMonsterEntering(true);
									monster.setMonsterState('run');
									monster.playAnimation('Run');
									monster.setAnimationSpeed(1);
								} else if (isHidden && checkCount >= maxChecks) {
									clearInterval(checkInterval);
									hiding.setMonsterKnocking(false);
									monster.setMonsterState('leaving');
									monster.playAnimation('Walk');
									monster.setAnimationSpeed(0.5);
									monster.setTargetPosition([0, 0, 2]);

									// Surveiller si le joueur sort pendant que le monstre part
									const checkPlayerHiding = setInterval(() => {
										const hiding = useHiding.getState();
										const monster = useMonster.getState();
										const doors = useDoor.getState();

										console.log('État actuel:', JSON.stringify({
											hiding: {
												isPlayerHidden: hiding.isPlayerHidden,
												hideSpot: hiding.hideSpot,
												canExitHiding: hiding.canExitHiding,
												monsterKnocking: hiding.isMonsterKnocking,
												monsterEntering: hiding.isMonsterEntering
											},
											monster: {
												state: monster.monsterState,
												position: monster.monsterPosition,
												targetPosition: monster.targetPosition
											},
											doors: {
												roomDoor: doors.roomDoor,
												roomCurtain: doors.roomCurtain
											}
										}, null, 2));

										const isStillHidden = hiding.isPlayerHidden;
										const currentMonsterState = monster.monsterState;
										const canExit = hiding.canExitHiding;

										// Si le joueur sort avant que canExitHiding soit true
										if (!isStillHidden && !canExit) {
											console.log('Le monstre attaque car:', {
												isStillHidden,
												canExit,
												hideSpot: hiding.hideSpot
											});
											clearInterval(checkPlayerHiding);
											monster.setMonsterState('run');
											monster.playAnimation('Run');
											monster.setAnimationSpeed(1);
										}
									}, 100);

									// Attendre 2 secondes puis fermer la porte
									setTimeout(() => {
										doors.setRoomDoor(room, false);
										hiding.setCanExitHiding(true);
										clearInterval(checkPlayerHiding);
									}, 2000);
								}
							}, 400);
						}
					}, 10000);
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
