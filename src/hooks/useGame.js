import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { seed } from '../utils/config';
import useHiding from './useHiding';
import levelData from '../components/Monster/Triggers/levelData';

const useGameStore = create(
	subscribeWithSelector((set, get) => ({
		seedData: seed,
		deaths: 0,
		setDeaths: (state) => set(() => ({ deaths: state })),

		realDeaths: 0,
		incrementRealDeaths: () =>
			set((state) => ({ realDeaths: state.realDeaths + 1 })),

		hasShownFirstDeathPopup: false,
		setHasShownFirstDeathPopup: (value) =>
			set({ hasShownFirstDeathPopup: value }),

		isGameplayActive: false,
		setIsGameplayActive: (state) => set(() => ({ isGameplayActive: state })),

		gameStartTime: Date.now(),
		setGameStartTime: () => set({ gameStartTime: Date.now() }),

		gameEndTime: null,
		setGameEndTime: () => set({ gameEndTime: Date.now() }),

		disableControls: false,
		setDisableControls: (state) => set(() => ({ disableControls: state })),

		monsterAttackDisableControls: false,
		setMonsterAttackDisableControls: (state) =>
			set(() => ({ monsterAttackDisableControls: state })),

		isPlaying: false,
		setIsPlaying: (state) => set(() => ({ isPlaying: state })),

		customDeathMessage: null,
		setCustomDeathMessage: (message) => set({ customDeathMessage: message }),

		shouldRenderThreeJs: false,
		setShouldRenderThreeJs: (value) => set({ shouldRenderThreeJs: value }),

		setSeedData: (newSeedData) => {
			set({ seedData: newSeedData });
		},

		// Monster assignment system
		roomMonsterAssignments: {},
		setRoomMonsterAssignments: (assignments) =>
			set({ roomMonsterAssignments: assignments }),

		generateMonsterAssignments: () => {
			const state = get();
			const availableMonsters = [
				'terra',
				'jean',
				'hugo',
				'grim',
				'theo',
				'pota',
			];
			const roomKeys = Object.keys(state.seedData);
			const assignments = {};

			// Filter out empty rooms
			const validRooms = roomKeys.filter((roomKey) => {
				const roomData = state.seedData[roomKey];
				return roomData && roomData.type !== 'empty';
			});

			if (validRooms.length === 0) {
				set({ roomMonsterAssignments: assignments });
				return assignments;
			}

			// Create a pool of monsters, ensuring each monster appears at least once
			let monsterPool = [...availableMonsters];

			// If we have more rooms than monsters, duplicate monsters randomly
			while (monsterPool.length < validRooms.length) {
				const randomMonster =
					availableMonsters[
						Math.floor(Math.random() * availableMonsters.length)
					];
				monsterPool.push(randomMonster);
			}

			// Shuffle the monster pool
			for (let i = monsterPool.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[monsterPool[i], monsterPool[j]] = [monsterPool[j], monsterPool[i]];
			}

			// Assign monsters to rooms
			validRooms.forEach((roomKey, index) => {
				assignments[roomKey] = monsterPool[index % monsterPool.length];
			});

			set({ roomMonsterAssignments: assignments });
			return assignments;
		},

		getMonsterForRoom: (roomIndex) => {
			const state = get();
			const roomKeys = Object.keys(state.seedData);
			const roomKey = roomKeys[roomIndex];

			if (!roomKey || !state.roomMonsterAssignments[roomKey]) {
				return 'hugo';
			}

			return state.roomMonsterAssignments[roomKey];
		},

		isTutorialOpen: false,
		setIsTutorialOpen: (state) => set(() => ({ isTutorialOpen: state })),

		openDeathScreen: false,
		setOpenDeathScreen: (state) => set(() => ({ openDeathScreen: state })),

		isEndScreen: false,
		setIsEndScreen: (state) => set(() => ({ isEndScreen: state })),

		isEndAnimationPlaying: false,
		setIsEndAnimationPlaying: (state) =>
			set(() => ({ isEndAnimationPlaying: state })),

		alternateTutorialRoom: false,
		setAlternateTutorialRoom: (state) =>
			set(() => ({ alternateTutorialRoom: state })),

		endAnimationPlaying: false,
		setEndAnimationPlaying: (state) =>
			set(() => ({ endAnimationPlaying: state })),

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

		playIntro: false,
		setPlayIntro: (value) => set({ playIntro: value }),

		introIsPlaying: false,
		setIntroIsPlaying: (value) => set({ introIsPlaying: value }),

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

		// Raid state tracking
		activeRaids: [],
		setActiveRaid: (room, isActive) =>
			set((state) => {
				const newActiveRaids = [...state.activeRaids];
				const index = newActiveRaids.indexOf(room);

				if (isActive && index === -1) {
					newActiveRaids.push(room);
				} else if (!isActive && index !== -1) {
					newActiveRaids.splice(index, 1);
				}

				return { activeRaids: newActiveRaids };
			}),

		// Inscriptions state tracking
		activeInscriptions: [],
		setActiveInscriptions: (room, isActive) =>
			set((state) => {
				const newActiveInscriptions = [...state.activeInscriptions];
				const index = newActiveInscriptions.indexOf(room);

				if (isActive && index === -1) {
					newActiveInscriptions.push(room);
				} else if (!isActive && index !== -1) {
					newActiveInscriptions.splice(index, 1);
				}

				return { activeInscriptions: newActiveInscriptions };
			}),

		// Knocking
		knockedRooms: [],
		addKnockedRoom: (room) =>
			set((state) => ({ knockedRooms: [...state.knockedRooms, room] })),

		isListening: false,
		setIsListening: (value) => set({ isListening: value }),

		jumpScare: false,
		setJumpScare: (state) => set({ jumpScare: state }),

		mannequinHidden: true,
		setMannequinHidden: (value) => set({ mannequinHidden: value }),

		performanceMode: false,
		setPerformanceMode: (mode) => set({ performanceMode: mode }),

		completedObjective: null,
		completedRoom: null,

		checkObjectiveCompletion: (objective, room) => {
			set({
				completedObjective: objective,
				completedRoom: room,
			});
		},

		resetCompletedObjective: () => {
			set({
				completedObjective: null,
				completedRoom: null,
			});
		},

		restart: () => {
			const state = get();
			set((prevState) => ({
				deaths: prevState.deaths + 1,
				playerPositionRoom: null,
				resetFootstepSound: true,
				cameraShakingWhenLookingAtMonster: false,
				shakeIntensity: 0,
				roomLight: false,
				bathroomLight: false,
				activeRadios: [],
				activeTvs: [],
				activeRaids: [],
				activeInscriptions: [],
				playIntro: false,
				knockedRooms: [],
				jumpScare: false,
				seedData: seed,
				customDeathMessage: null,
				disableControls: false,
				monsterAttackDisableControls: false,
				completedObjective: null,
				completedRoom: null,
				endAnimationPlaying: false,
				gameEndTime: null,
			}));

			// Regenerate monster assignments on restart
			const newState = get();
			newState.generateMonsterAssignments();

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

		isCrouchLocked: false,
		setIsCrouchLocked: (value) => set({ isCrouchLocked: value }),

		temporaryDisableMouseLook: false,
		setTemporaryDisableMouseLook: (value) =>
			set({ temporaryDisableMouseLook: value }),

		seenLevels: new Set(),

		addSeenLevel: (levelKey) =>
			set((state) => {
				if (levelKey.includes('_empty')) return state;

				const validLevelKeys = Object.keys(levelData);
				if (!validLevelKeys.includes(levelKey)) return state;

				const newSeenLevels = new Set(state.seenLevels);
				newSeenLevels.add(levelKey);

				localStorage.setItem(
					'seenLevels',
					JSON.stringify(Array.from(newSeenLevels))
				);

				return { seenLevels: newSeenLevels };
			}),

		totalLevelTypes: Object.keys(levelData).length,
	}))
);

export default useGameStore;
