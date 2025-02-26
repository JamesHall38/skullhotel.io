import levelData from '../components/Monster/Triggers/levelData';
import useGameplaySettings from '../hooks/useGameplaySettings';

// Helper function to get random room data of a specific type
function getRandomRoomDataByType(type, usedRoomData = []) {
	const roomsOfType = Object.entries(levelData)
		.filter(([, data]) => data.type === type)
		.filter(([, data]) => !usedRoomData.includes(data));

	if (roomsOfType.length === 0) {
		const anyRoomOfType = Object.entries(levelData).filter(
			([, data]) => data.type === type
		);
		if (anyRoomOfType.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * anyRoomOfType.length);
		return {
			key: anyRoomOfType[randomIndex][0],
			data: anyRoomOfType[randomIndex][1],
		};
	}

	const randomIndex = Math.floor(Math.random() * roomsOfType.length);
	return {
		key: roomsOfType[randomIndex][0],
		data: roomsOfType[randomIndex][1],
	};
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
			usedRoomData.push(roomData.data);
			seed[roomData.key] = {
				...roomData.data,
				type: 'hideout',
				number: currentRoom + i + 1,
			};
		}
	}
	currentRoom += hideoutRooms;

	// Add landmine rooms
	for (let i = 0; i < landmineRooms; i++) {
		const room = getRandomRoomDataByType('landmine', usedRoomData);
		if (room) {
			usedRoomData.push(room.data);
			seed[room.key] = {
				...room.data,
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
			usedRoomData.push(roomData.data);
			seed[roomData.key] = {
				...roomData.data,
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
			usedRoomData.push(roomData.data);
			seed[roomData.key] = {
				...roomData.data,
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
			usedRoomData.push(roomData.data);
			seed[roomData.key] = {
				...roomData.data,
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

		const hideSpot =
			hideObjectives[Math.floor(Math.random() * hideObjectives.length)];

		seed[`raid_${i + 1}`] = {
			type: 'empty',
			hideSpot,
			isRaid: true,
			number: currentRoom + i + 1,
			hideObjective: hideSpot,
		};
	}
	currentRoom += raidRooms;

	const shuffledSeed = {};
	const roomKeys = Object.keys(seed);
	const shuffledIndices = [...Array(roomKeys.length).keys()].sort(
		() => Math.random() - 0.5
	);

	const tempSeed = {};
	shuffledIndices.forEach((newIndex, originalIndex) => {
		const originalKey = roomKeys[originalIndex];
		tempSeed[newIndex + 1] = {
			...seed[originalKey],
			originalKey,
			number: newIndex + 1,
		};
	});

	Object.values(tempSeed).forEach((room) => {
		shuffledSeed[room.originalKey] = room;
	});

	return shuffledSeed;
}
