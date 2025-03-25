import { create } from 'zustand';

const useGameplaySettings = create((set) => ({
	roomCount: 16,

	hideoutPercentage: 10,
	landminePercentage: 10,
	claymorePercentage: 10,
	hunterPercentage: 10,
	sonarPercentage: 10,

	emptyRoomPercentage: 40,
	raidPercentage: 10,

	randomRoomPercentage: 30,

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
