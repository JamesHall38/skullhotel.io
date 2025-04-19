import { create } from 'zustand';

const useSettings = create((set) => ({
	horizontalSensitivity: 0.15,
	setHorizontalSensitivity: (value) => set({ horizontalSensitivity: value }),
	verticalSensitivity: 0.15,
	setVerticalSensitivity: (value) => set({ verticalSensitivity: value }),
	rotationSensitivity: 0.15,
	setRotationSensitivity: (value) =>
		set({
			rotationSensitivity: value,
			horizontalSensitivity: value,
			verticalSensitivity: value,
		}),
	shadows: true,
	setShadows: (value) => set({ shadows: value }),
}));

export default useSettings;
