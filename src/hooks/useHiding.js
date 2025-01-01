import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useHiding = create(
	subscribeWithSelector((set) => ({
		isMonsterKnocking: false,
		setMonsterKnocking: (state) => set(() => ({ isMonsterKnocking: state })),

		knockingRoom: null,
		setKnockingRoom: (room) => set(() => ({ knockingRoom: room })),

		isMonsterEntering: false,
		setMonsterEntering: (state) => set(() => ({ isMonsterEntering: state })),

		isPlayerHidden: false,
		setPlayerHidden: (state) => set(() => ({ isPlayerHidden: state })),

		hideSpot: null,
		setHideSpot: (spot) => set(() => ({ hideSpot: spot })),

		restart: () => {
			set(() => ({
				isMonsterKnocking: false,
				knockingRoom: null,
				isMonsterEntering: false,
				isPlayerHidden: false,
				hideSpot: null,
			}));
		},
	}))
);

export default useHiding;
