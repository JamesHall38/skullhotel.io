import { create } from 'zustand';

const useGameplaySettings = create((set) => ({
	roomCount: 20,

	hideoutPercentage: 10,
	landminePercentage: 10,
	claymorePercentage: 10,
	hunterPercentage: 10,
	sonarPercentage: 10,

	emptyRoomPercentage: 40,
	raidPercentage: 10,

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
}));

export default useGameplaySettings;
