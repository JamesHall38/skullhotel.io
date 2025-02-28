import { create } from 'zustand';

const useSettings = create((set) => ({
	rotationSensitivity: 0.15,
	setRotationSensitivity: (value) => set({ rotationSensitivity: value }),
	shadows: true,
	setShadows: (value) => set({ shadows: value }),
}));

export default useSettings;
