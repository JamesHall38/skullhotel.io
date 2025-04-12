import { create } from 'zustand';

const useGameplaySettings = create((set) => ({
	roomCount: 16,

	hideoutPercentage: 12.5, // 2 rooms ( 16 * 12.5% = 2 )
	landminePercentage: 12.5, // 2 rooms ( 16 * 12.5% = 2 )
	claymorePercentage: 6.25, // 1 room ( 16 * 6.25% = 1 )
	hunterPercentage: 6.25, // 1 room ( 16 * 6.25% = 1 )
	sonarPercentage: 6.25, // 1 room ( 16 * 6.25% = 1 )

	emptyRoomPercentage: 43.75, // 7 rooms ( 16 * 43.75% = 7 )
	raidPercentage: 6.25, // 1 room ( 16 * 6.25% = 1 )

	randomRoomPercentage: 6.25, // 1 room ( 16 * 6.25% = 1 )

	setRoomCount: (count) => set({ roomCount: count }),

	setHideoutPercentage: (percentage) => set({ hideoutPercentage: percentage }),
	setLandminePercentage: (percentage) =>
		set({ landminePercentage: percentage }),
	setClaymorePercentage: (percentage) =>
		set({ claymorePercentage: percentage }),
	setHunterPercentage: (percentage) => set({ hunterPercentage: percentage }),
	setSonarPercentage: (percentage) => set({ sonarPercentage: percentage }),

	setEmptyRoomPercentage: (percentage) =>
		set({ emptyRoomPercentage: percentage }),
	setRaidPercentage: (percentage) => set({ raidPercentage: percentage }),

	setRandomRoomPercentage: (value) => set({ randomRoomPercentage: value }),
}));

export default useGameplaySettings;
