import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { roomNumber } from '../utils/config';
import useDoor from './useDoor';
import useGame from './useGame';
import useHiding from './useHiding';

const useInterfaceStore = create(
	subscribeWithSelector((set, get) => ({
		cursor: null,
		setCursor: (cursor) => set(() => ({ cursor })),

		fadeToBlack: 0, // 0 = no fade, 1 = fully black
		setFadeToBlack: (value) => set(() => ({ fadeToBlack: value })),

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

		completedAnimations: 0,
		totalAnimations: 7, // 1 AnimatedTitle + 6 TrianglePatterns
		incrementCompletedAnimations: () =>
			set((state) => ({ completedAnimations: state.completedAnimations + 1 })),
		resetAnimationsCount: () => set({ completedAnimations: 0 }),
		isAllAnimationsComplete: () => get().completedAnimations > 0,

		tutorialObjectives: window.location.hash.includes('#debug')
			? [true, true, true, true, true]
			: [false, false, false, false, false],

		recentlyChangedObjectives: [false, false, false, false, false],

		setTutorialObjectives: (objective) => {
			const current = get().tutorialObjectives;
			if (JSON.stringify(current) !== JSON.stringify(objective)) {
				const changedIndices = [];
				for (let i = 0; i < objective.length; i++) {
					if (current[i] !== objective[i]) {
						changedIndices.push(i);
					}
				}

				const newRecentlyChanged = [false, false, false, false, false];
				changedIndices.forEach((index) => {
					newRecentlyChanged[index] = true;
				});

				set(() => ({
					tutorialObjectives: objective,
					recentlyChangedObjectives: newRecentlyChanged,
				}));

				setTimeout(() => {
					set(() => ({
						recentlyChangedObjectives: [false, false, false, false, false],
					}));
				}, 1000);
			}
		},

		interfaceObjectives: [...Array(roomNumber)].map(() => [
			false,
			false,
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

		isTutorialCompleted: false,
		setIsTutorialCompleted: (completed) =>
			set(() => ({ isTutorialCompleted: completed })),

		hasEverCompletedTutorial: (() => {
			try {
				return localStorage.getItem('hasEverCompletedTutorial') === 'true';
			} catch (e) {
				return false;
			}
		})(),
		setHasEverCompletedTutorial: (value) => {
			try {
				localStorage.setItem(
					'hasEverCompletedTutorial',
					value ? 'true' : 'false'
				);
			} catch (e) {}
			set(() => ({ hasEverCompletedTutorial: value }));
		},

		tutorialResetTrigger: 0,

		setAllObjectivesCompleted: () => {
			set(() => ({
				tutorialObjectives: [true, true, true, true, true],
				interfaceObjectives: [...Array(roomNumber)].map(() => [
					true,
					true,
					true,
					true,
					true,
				]),
			}));
		},

		interfaceAction: '',
		setInterfaceAction: (action) => set(() => ({ interfaceAction: action })),

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
					false,
					false,
				]),
				tutorialObjectives: [true, true, true, true, true],
				recentlyChangedObjectives: [false, false, false, false, false],
				cursor: null,
				fadeToBlack: 0,
				customTutorialObjectives: null,
				completedAnimations: 0,
				isSettingsOpen: false,
			}));
		},

		resetTutorial: () => {
			set((state) => ({
				tutorialObjectives: [false, false, false, false, false],
				recentlyChangedObjectives: [false, false, false, false, false],
				customTutorialObjectives: null,
				isTutorialCompleted: false,
				currentDialogueIndex: null,
				tutorialResetTrigger: state.tutorialResetTrigger + 1,
			}));

			useDoor.getState().resetTutorial();

			useGame.getState().resetTutorial();

			useHiding.getState().restart();
		},
	}))
);

export default useInterfaceStore;
