import { create } from 'zustand';

const useJoysticksStore = create((set) => ({
	leftStickRef: { current: null },
	rightStickRef: { current: null },
	controls: {
		left: false,
		right: false,
		forward: false,
		backward: false,
		jump: false,
		action: false,
		run: false,
		crouch: false,
	},
	setControl: (control, value) =>
		set((state) => ({
			controls: {
				...state.controls,
				[control]: value,
			},
		})),
}));

export default useJoysticksStore;
