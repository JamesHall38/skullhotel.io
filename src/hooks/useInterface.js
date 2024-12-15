import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { roomNumber } from '../utils/config';

const useInterfaceStore = create(
	subscribeWithSelector((set) => ({
		cursor: null,
		setCursor: (cursor) => set(() => ({ cursor })),

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
			}));
		},
	}))
);

export default useInterfaceStore;
