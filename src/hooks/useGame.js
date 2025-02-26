import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { seed } from '../utils/config';
import useHiding from './useHiding';
import useMonster from './useMonster';
import useDoor from './useDoor';
import useGameplaySettings from './useGameplaySettings';

const CORRIDORLENGTH = 5.95;

const useGameStore = create(
	subscribeWithSelector((set, get) => ({
		seedData: seed,
		deaths: 0,

		isPlaying: false,
		setIsPlaying: (state) => set(() => ({ isPlaying: state })),

		customDeathMessage: null,
		setCustomDeathMessage: (message) => set({ customDeathMessage: message }),

		setSeedData: (newSeedData) => {
			set({ seedData: newSeedData });
		},

		isTutorialOpen: false,
		setIsTutorialOpen: (state) => set(() => ({ isTutorialOpen: state })),

		openDeathScreen: false,
		setOpenDeathScreen: (state) => set(() => ({ openDeathScreen: state })),

		// loading: true,
		loading: false,
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

		// Knocking
		knockedRooms: [],
		addKnockedRoom: (room) =>
			set((state) => ({ knockedRooms: [...state.knockedRooms, room] })),

		isListening: false,
		setIsListening: (value) => set({ isListening: value }),

		// Objectives
		monsterKnockDuration: 5000,
		setMonsterKnockDuration: (duration) =>
			set({ monsterKnockDuration: duration }),

		jumpScare: false,
		setJumpScare: (state) => set({ jumpScare: state }),

		performanceMode: false,
		setPerformanceMode: (mode) => set({ performanceMode: mode }),

		checkObjectiveCompletion: (objective, room) => {
			const state = get();
			const roomCount = useGameplaySettings.getState().roomCount;

			const roomData = Object.values(state.seedData)[state.playerPositionRoom];
			state.seedData[
				`hiding_${room === 'window' ? 1 : room === 'bedsheets' ? 2 : 3}`
			];

			if (roomData?.hideObjective === objective) {
				const hiding = useHiding.getState();
				const monster = useMonster.getState();
				const doors = useDoor.getState();

				let monsterX;
				if (room >= roomCount / 2) {
					monsterX = -(room - roomCount / 2) * CORRIDORLENGTH;
				} else {
					monsterX = -room * CORRIDORLENGTH;
				}

				monster.setMonsterPosition([monsterX, 0, 0]);
				monster.setMonsterRotation([0, 0, 0]);

				if (doors.roomDoor[room]) {
					state.setShakeIntensity(10);
					monster.setMonsterState('run');
					monster.playAnimation('Run');
					monster.setAnimationSpeed(1);
				} else if (
					objective === roomData.hideObjective &&
					!state.knockedRooms.includes(room)
				) {
					state.addKnockedRoom(room);
					hiding.setMonsterKnocking(true);
					hiding.setKnockingRoom(room);
					hiding.setHideSpot(roomData.hideSpot);

					setTimeout(() => {
						const hiding = useHiding.getState();
						const monster = useMonster.getState();
						let doors = useDoor.getState();

						if (hiding.isMonsterKnocking) {
							doors.setRoomDoor(room, true);
							monster.playAnimation('Idle');

							const isHidden = useHiding.getState().isPlayerHidden;

							if (!isHidden) {
								hiding.setMonsterKnocking(false);
								hiding.setMonsterEntering(true);
								state.setShakeIntensity(10);
								monster.setMonsterState('run');
								monster.playAnimation('Run');
								monster.setAnimationSpeed(1);
							} else {
								hiding.setMonsterKnocking(false);
								monster.setAnimationMixSpeed(2);
								monster.setAnimationSpeed(0.5);
								monster.setMonsterState('leaving');
								monster.playAnimation('Walk');
							}
						}
					}, state.monsterKnockDuration);
				}
			}
		},

		restart: () => {
			set((state) => ({
				deaths: state.deaths + 1,
				playerPositionRoom: null,
				resetFootstepSound: true,
				cameraShakingWhenLookingAtMonster: false,
				shakeIntensity: 0,
				roomLight: false,
				bathroomLight: false,
				activeRadios: [],
				activeTvs: [],
				playIntro: false,
				knockedRooms: [],
				jumpScare: false,
				seedData: seed,
				customDeathMessage: null,
			}));
			useHiding.getState().restart();
		},

		isRunning: false,
		setIsRunning: (value) => set({ isRunning: value }),

		mobileClick: false,
		setMobileClick: (value) => set({ mobileClick: value }),

		releaseMobileClick: false,
		setReleaseMobileClick: (value) => set({ releaseMobileClick: value }),

		isCameraLocked: false,
		setCameraLocked: (state) => set(() => ({ isCameraLocked: state })),
	}))
);

// Surveiller les changements dans interfaceObjectives
// useInterface.subscribe(
// 	(state) => state.interfaceObjectives,
// 	(interfaceObjectives) => {
// 		const gameState = useGameStore.getState();
// 		const roomNumber = gameState.playerPositionRoom;
// 		if (roomNumber === null) return;

// 		const objectives = interfaceObjectives[roomNumber];
// 		if (!objectives) return;

// 		// Vérifier chaque objectif
// 		if (objectives[0]) {
// 			// bottles
// 			gameState.checkObjectiveCompletion('bottles', roomNumber);
// 		}
// 		if (objectives[1]) {
// 			// bedsheets
// 			gameState.checkObjectiveCompletion('bedsheets', roomNumber);
// 		}
// 		if (objectives[2]) {
// 			// window
// 			gameState.checkObjectiveCompletion('window', roomNumber);
// 		}
// 	}
// );

export default useGameStore;
