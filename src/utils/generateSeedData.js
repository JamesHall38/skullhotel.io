import levelData from '../components/Monster/Triggers/levelData';
import useGameplaySettings from '../hooks/useGameplaySettings';

// Helper function to get random room data of a specific type
function getRandomRoomDataByType(type, usedRoomData = []) {
	const roomsOfType = Object.entries(levelData)
		.filter(([, data]) => data.type === type)
		.filter(([, data]) => !usedRoomData.includes(data));

	if (roomsOfType.length === 0) {
		// If all rooms have been used, return any room of this type
		const anyRoomOfType = Object.entries(levelData).filter(
			([, data]) => data.type === type
		);
		if (anyRoomOfType.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * anyRoomOfType.length);
		return anyRoomOfType[randomIndex][1];
	}

	const randomIndex = Math.floor(Math.random() * roomsOfType.length);
	return roomsOfType[randomIndex][1];
}

export default function generateSeedData() {
	const roomCount = useGameplaySettings.getState().roomCount;
	const emptyRoomPercentage =
		useGameplaySettings.getState().emptyRoomPercentage;
	const hideoutPercentage = useGameplaySettings.getState().hideoutPercentage;
	const landminePercentage = useGameplaySettings.getState().landminePercentage;
	const claymorePercentage = useGameplaySettings.getState().claymorePercentage;
	const hunterPercentage = useGameplaySettings.getState().hunterPercentage;
	const sonarPercentage = useGameplaySettings.getState().sonarPercentage;
	const raidPercentage = useGameplaySettings.getState().raidPercentage;

	const seed = {};
	const hidingRooms = {};

	// Add hiding rooms first (these are the mandatory rooms)
	Object.entries(hidingRooms).forEach(([key, room]) => {
		seed[key] = room;
	});

	// Calculate remaining rooms (roomCount - 1 car nous avons déjà une pièce empty)
	const remainingRooms = roomCount - Object.keys(hidingRooms).length;

	// Calculate rooms for each type based on percentages
	const totalPercentage =
		hideoutPercentage +
		landminePercentage +
		claymorePercentage +
		hunterPercentage +
		sonarPercentage +
		raidPercentage +
		emptyRoomPercentage;

	// Calculate exact numbers first
	const hideoutRoomsExact =
		remainingRooms * (hideoutPercentage / totalPercentage);
	const landmineRoomsExact =
		remainingRooms * (landminePercentage / totalPercentage);
	const claymoreRoomsExact =
		remainingRooms * (claymorePercentage / totalPercentage);
	const hunterRoomsExact =
		remainingRooms * (hunterPercentage / totalPercentage);
	const sonarRoomsExact = remainingRooms * (sonarPercentage / totalPercentage);
	const raidRoomsExact = remainingRooms * (raidPercentage / totalPercentage);

	// Round to nearest integer instead of floor
	const hideoutRooms = Math.round(hideoutRoomsExact);
	const landmineRooms = Math.round(landmineRoomsExact);
	const claymoreRooms = Math.round(claymoreRoomsExact);
	const hunterRooms = Math.round(hunterRoomsExact);
	const sonarRooms = Math.round(sonarRoomsExact);
	const raidRooms = Math.round(raidRoomsExact);

	// Ensure total rooms equals roomCount by adjusting empty rooms if necessary
	const totalRoomsBeforeEmpty =
		hideoutRooms +
		landmineRooms +
		claymoreRooms +
		hunterRooms +
		sonarRooms +
		raidRooms +
		Object.keys(hidingRooms).length;

	// Adjust empty rooms to make total equal to roomCount
	const emptyRoomsAdjusted = roomCount - totalRoomsBeforeEmpty;

	let currentRoom = Object.keys(seed).length;

	const usedRoomData = [];

	// Add hideout rooms
	for (let i = 0; i < hideoutRooms; i++) {
		const roomData = getRandomRoomDataByType('hideout', usedRoomData);
		if (roomData) {
			usedRoomData.push(roomData);
			seed[`hideout_${i + 1}`] = {
				...roomData,
				type: 'hideout',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += hideoutRooms;

	// Add landmine rooms
	for (let i = 0; i < landmineRooms; i++) {
		const roomData = getRandomRoomDataByType('landmine', usedRoomData);
		if (roomData) {
			usedRoomData.push(roomData);
			seed[`landmine_${i + 1}`] = {
				...roomData,
				type: 'landmine',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += landmineRooms;

	// Add claymore rooms
	for (let i = 0; i < claymoreRooms; i++) {
		const roomData = getRandomRoomDataByType('claymore', usedRoomData);
		if (roomData) {
			usedRoomData.push(roomData);
			seed[`claymore_${i + 1}`] = {
				...roomData,
				type: 'claymore',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += claymoreRooms;

	// Add hunter rooms
	for (let i = 0; i < hunterRooms; i++) {
		const roomData = getRandomRoomDataByType('hunter', usedRoomData);
		if (roomData) {
			usedRoomData.push(roomData);
			seed[`hunter_${i + 1}`] = {
				...roomData,
				type: 'hunter',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += hunterRooms;

	// Add sonar rooms
	for (let i = 0; i < sonarRooms; i++) {
		const roomData = getRandomRoomDataByType('sonar', usedRoomData);
		if (roomData) {
			usedRoomData.push(roomData);
			seed[`sonar_${i + 1}`] = {
				...roomData,
				type: 'sonar',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += sonarRooms;

	// Add empty rooms
	for (let i = 0; i < emptyRoomsAdjusted; i++) {
		seed[`empty_${i + Object.keys(hidingRooms).length + 1}`] = {
			type: 'empty',
			number: currentRoom + i + 1,
		};
	}

	// Add raid rooms
	for (let i = 0; i < raidRooms; i++) {
		const hideObjectives = ['window', 'bedsheets', 'bottles'];

		seed[`raid_${i + 1}`] = {
			type: 'raid',
			number: currentRoom + i + 1,
			hideObjective:
				hideObjectives[Math.floor(Math.random() * hideObjectives.length)],
		};
	}
	currentRoom += raidRooms;

	// Randomly shuffle the rooms
	const shuffledSeed = {};
	const roomKeys = Object.keys(seed);
	const shuffledKeys = [...roomKeys].sort(() => Math.random() - 0.5);

	shuffledKeys.forEach((key, index) => {
		const newKey = roomKeys[index];
		shuffledSeed[newKey] = {
			...seed[key],
			number: index + 1,
		};
	});

	return shuffledSeed;
}
