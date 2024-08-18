import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useMonsterStore = create(
	subscribeWithSelector((set) => ({
		monsterState: 'hidden',
		setMonsterState: (name) => set(() => ({ monsterState: name })),

		// Position
		monsterPosition: [0, 0, 0],
		setMonsterPosition: (position) =>
			set(() => ({ monsterPosition: position })),
		monsterRotation: [0, 0, 0],
		setMonsterRotation: (rotation) =>
			set(() => ({ monsterRotation: rotation })),

		// Animation
		animationName: 'Run',
		playAnimation: (animation) => set(() => ({ animationName: animation })),
		animationSpeed: 1,
		setAnimationSpeed: (speed) => set(() => ({ animationSpeed: speed })),
		animationMixSpeed: 3,
		setAnimationMixSpeed: (mixSpeed) =>
			set(() => ({ animationMixSpeed: mixSpeed })),

		restart: () => {
			set(() => ({
				monsterState: 'hidden',
				monsterPosition: [0, 0, 0],
				monsterRotation: [0, 0, 0],
				animationName: 'Run',
				animationSpeed: 1,
				animationMixSpeed: 3,
			}));
		},
	}))
);

export default useMonsterStore;
