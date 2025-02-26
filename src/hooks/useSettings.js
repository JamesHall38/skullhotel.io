import { create } from 'zustand';

const useSettings = create((set) => ({
	rotationSensitivity: 0.15,
	setRotationSensitivity: (value) => set({ rotationSensitivity: value }),
}));

export default useSettings;
