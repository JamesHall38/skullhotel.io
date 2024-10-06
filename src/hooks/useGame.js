import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { seed, roomNumber, events } from '../utils/config';

const useGeneralStore = create(
	subscribeWithSelector((set) => ({
		seedData: seed,
		eventData: events,
		deaths: 0,

		isMobile: false,
		setIsMobile: (value) => set({ isMobile: value }),

		deviceMode: 'keyboard',
		setDeviceMode: (mode) => set(() => ({ deviceMode: mode })),

		isLocked: false,
		setIsLocked: (locked) => set({ isLocked: locked }),

		end: false,
		setEnd: (state) => set(() => ({ end: state })),

		// Room
		roomTotal: roomNumber,
		playerPositionRoom: null,
		setPlayerPositionRoom: (position) =>
			set(() => ({ playerPositionRoom: position })),

		// Camera Shaking
		cameraShakingWhenLookingAtMonster: false,
		setCameraShakingWhenLookingAtMonster: (state) =>
			set(() => ({ cameraShakingWhenLookingAtMonster: state })),
		shakeIntensity: 0,
		setShakeIntensity: (intensity) =>
			set(() => ({ shakeIntensity: intensity })),

		// Lights
		roomLight: false,
		setRoomLight: (state) => set(() => ({ roomLight: state })),
		bathroomLight: false,
		setBathroomLight: (state) => set(() => ({ bathroomLight: state })),

		restart: () => {
			set((state) => ({
				seedData: seed,
				eventData: events,
				deaths: state.deaths + 1,
				roomTotal: roomNumber,
				playerPositionRoom: null,
				cameraShakingWhenLookingAtMonster: false,
				shakeIntensity: 0,
				roomLight: false,
				bathroomLight: false,
			}));
		},
	}))
);

export default useGeneralStore;
