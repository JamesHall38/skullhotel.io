import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useMonsterStore = create(
	subscribeWithSelector((set) => ({
		monsterState: 'hidden',
		setMonsterState: (name) => set(() => ({ monsterState: name })),

		// Position
		monsterPosition: [0, 10, 0],
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
		animationMixSpeed: 10,
		setAnimationMixSpeed: (mixSpeed) =>
			set(() => ({ animationMixSpeed: mixSpeed })),

		isAttacking: false,
		setIsAttacking: (isAttacking) => set(() => ({ isAttacking })),

		restart: () => {
			set(() => ({
				monsterState: 'hidden',
				monsterPosition: [0, 10, 0],
				monsterRotation: [0, 0, 0],
				isAttacking: false,
				animationName: 'Run',
				animationSpeed: 1,
				animationMixSpeed: 10,
			}));
		},

		targetPosition: null,
		setTargetPosition: (position) => set({ targetPosition: position }),
	}))
);

export default useMonsterStore;
