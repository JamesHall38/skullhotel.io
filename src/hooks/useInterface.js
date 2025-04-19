import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { roomNumber } from '../utils/config';

const useInterfaceStore = create(
	subscribeWithSelector((set, get) => ({
		cursor: null,
		setCursor: (cursor) => set(() => ({ cursor })),

		// Fade to black effect
		fadeToBlack: 0, // 0 = no fade, 1 = fully black
		setFadeToBlack: (value) => set(() => ({ fadeToBlack: value })),

		// Settings popup state
		isSettingsOpen: false,
		setIsSettingsOpen: (state) => set(() => ({ isSettingsOpen: state })),

		isAnyPopupOpen: false,
		setIsAnyPopupOpen: (state) => {
			if (get().isAnyPopupOpen === true && state === false) {
				setTimeout(() => {
					set({ isAnyPopupOpen: false });
				}, 300);
			} else {
				set({ isAnyPopupOpen: state });
			}
		},

		// Animation tracking
		completedAnimations: 0,
		totalAnimations: 7, // 1 AnimatedTitle + 6 TrianglePatterns
		incrementCompletedAnimations: () =>
			set((state) => ({ completedAnimations: state.completedAnimations + 1 })),
		resetAnimationsCount: () => set({ completedAnimations: 0 }),
		isAllAnimationsComplete: () => get().completedAnimations > 0,

		// Objectives
		tutorialObjectives:
			window.location.hash === '#debug'
				? [true, true, true]
				: [false, false, false],
		// tutorialObjectives: [true, true, true],
		setTutorialObjectives: (objective) =>
			set(() => ({ tutorialObjectives: objective })),
		interfaceObjectives: [...Array(roomNumber)].map(() => [
			false,
			false,
			false,
		]),
		setInterfaceObjectives: (objective, number) => {
			set((state) => {
				const newObjectives = [...state.interfaceObjectives];
				if (newObjectives[number]) {
					newObjectives[number][objective] = true;
				}
				return { interfaceObjectives: newObjectives };
			});
		},

		customTutorialObjectives: null,
		setCustomTutorialObjectives: (objectives) =>
			set(() => ({ customTutorialObjectives: objectives })),

		setAllObjectivesCompleted: () => {
			set(() => ({
				tutorialObjectives: [true, true, true],
				interfaceObjectives: [...Array(roomNumber)].map(() => [
					true,
					true,
					true,
				]),
			}));
		},

		interfaceAction: '',
		setInterfaceAction: (action) => set(() => ({ interfaceAction: action })),

		// Dialogues
		currentDialogueIndex: null,
		setCurrentDialogueIndex: (index) =>
			set(() => ({ currentDialogueIndex: index })),

		restart: () => {
			set(() => ({
				currentDialogueIndex: null,
				interfaceAction: '',
				interfaceObjectives: [...Array(roomNumber)].map(() => [
					false,
					false,
					false,
				]),
				cursor: null,
				fadeToBlack: 0,
				customTutorialObjectives: null,
				completedAnimations: 0,
				isSettingsOpen: false,
			}));
		},
	}))
);

export default useInterfaceStore;
