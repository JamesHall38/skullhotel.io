import { create } from 'zustand';

const useJoysticksStore = create((set) => ({
	leftStickRef: { current: null },
	rightStickRef: { current: null },
	setLeftStickRef: (ref) => set({ leftStickRef: ref }),
	setRightStickRef: (ref) => set({ rightStickRef: ref }),
}));

export default useJoysticksStore;
