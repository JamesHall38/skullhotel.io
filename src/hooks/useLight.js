import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export default create(
	subscribeWithSelector((set) => ({
		leftLight: {
			color: '#fff9eb',
			intensity: 0.5,
		},
		radioLight: {
			color: '#fff0be',
			intensity: 0,
		},
		rightLight: {
			color: '#fff9eb',
			intensity: 0.5,
		},
		couchLight: {
			color: '#ff0000',
			intensity: 0.5,
		},
		wallLight: {
			color: '#ffffff',
			intensity: 0.5,
		},
		tvLight: {
			color: '#ffffff',
			intensity: 0,
		},
		receptionLight1: {
			color: '#ff0000',
			intensity: 0,
		},
		receptionLight2: {
			color: '#00ff00',
			intensity: 1,
		},
		receptionLight3: {
			color: '#ffffff',
			intensity: 0.3,
		},
		flashlightEnabled: false,
		setFlashlightEnabled: (enabled) => set({ flashlightEnabled: enabled }),

		isRedLight: false,
		setIsRedLight: (isRed) => set({ isRedLight: isRed }),

		setLeftLight: (color, intensity) =>
			set((state) => ({
				leftLight: { ...state.leftLight, color, intensity },
			})),
		setRadioLight: (color, intensity) =>
			set((state) => ({
				radioLight: { ...state.radioLight, color, intensity },
			})),
		setRightLight: (color, intensity) =>
			set((state) => ({
				rightLight: { ...state.rightLight, color, intensity },
			})),
		setCouchLight: (color, intensity) =>
			set((state) => ({
				couchLight: { ...state.couchLight, color, intensity },
			})),
		setWallLight: (color, intensity) =>
			set((state) => ({
				wallLight: { ...state.wallLight, color, intensity },
			})),
		setTvLight: (color, intensity) =>
			set((state) => ({
				tvLight: { ...state.tvLight, color, intensity },
			})),
		setReceptionLight1: (color, intensity) =>
			set(() => ({
				receptionLight1: { color, intensity },
			})),
		setReceptionLight2: (color, intensity) =>
			set(() => ({
				receptionLight2: { color, intensity },
			})),
		setReceptionLight3: (color, intensity) =>
			set(() => ({
				receptionLight3: { color, intensity },
			})),
		restart: () =>
			set({
				receptionLight1: {
					color: '#ff0000',
					intensity: 0,
				},
				flashlightEnabled: false,
			}),
	}))
);
