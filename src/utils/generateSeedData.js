import levelData from '../components/Monster/Triggers/levelData';
import useGameplaySettings from '../hooks/useGameplaySettings';

function getRandomRoomDataByType(
	type,
	usedRoomData = [],
	seenLevels = new Set()
) {
	const allRoomsOfType = Object.entries(levelData).filter(
		([, data]) => data.type === type
	);

	const roomsOfType = allRoomsOfType.filter(
		([, data]) => !usedRoomData.includes(data)
	);

	if (roomsOfType.length === 0) {
		const anyRoomOfType = Object.entries(levelData).filter(
			([, data]) => data.type === type
		);
		if (anyRoomOfType.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * anyRoomOfType.length);
		const selected = {
			key: anyRoomOfType[randomIndex][0],
			data: anyRoomOfType[randomIndex][1],
		};
		return selected;
	}

	const unseenRooms = roomsOfType.filter(([key]) => !seenLevels.has(key));
	const seenRooms = roomsOfType.filter(([key]) => seenLevels.has(key));

	const weightedRooms = [];

	unseenRooms.forEach(([key, data]) => {
		const weight = 100;
		for (let i = 0; i < weight; i++) {
			weightedRooms.push({ key, data });
		}
	});

	seenRooms.forEach(([key, data]) => {
		const weight = 1;
		for (let i = 0; i < weight; i++) {
			weightedRooms.push({ key, data });
		}
	});

	const randomIndex = Math.floor(Math.random() * weightedRooms.length);
	const selected = weightedRooms[randomIndex];
	return selected;
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
	const randomRoomPercentage =
		useGameplaySettings.getState().randomRoomPercentage || 0;

	let seenLevels = new Set();
	try {
		const stored = localStorage.getItem('seenLevels');
		if (stored) {
			seenLevels = new Set(JSON.parse(stored));
		}
	} catch (error) {
		seenLevels = new Set();
	}

	const totalRoomsByType = {};
	Object.entries(levelData).forEach(([key, data]) => {
		if (!totalRoomsByType[data.type]) totalRoomsByType[data.type] = [];
		totalRoomsByType[data.type].push(key);
	});

	const seed = {};
	const hidingRooms = {};
	const usedKeys = new Set();

	const getUniqueKey = (baseKey) => {
		if (!usedKeys.has(baseKey)) {
			usedKeys.add(baseKey);
			return baseKey;
		}

		let uniqueKey = baseKey;
		let counter = 1;

		while (usedKeys.has(uniqueKey)) {
			uniqueKey = `${baseKey}_${counter}`;
			counter++;
		}

		usedKeys.add(uniqueKey);
		return uniqueKey;
	};

	Object.entries(hidingRooms).forEach(([key, room]) => {
		const uniqueKey = getUniqueKey(key);
		seed[uniqueKey] = {
			...room,
			baseKey: key,
		};
	});

	const remainingRooms = roomCount - Object.keys(hidingRooms).length;

	const totalPercentage =
		hideoutPercentage +
		landminePercentage +
		claymorePercentage +
		hunterPercentage +
		sonarPercentage +
		raidPercentage +
		randomRoomPercentage +
		emptyRoomPercentage;

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
	const randomRoomsExact =
		remainingRooms * (randomRoomPercentage / totalPercentage);

	const hideoutRooms = Math.round(hideoutRoomsExact);
	const landmineRooms = Math.round(landmineRoomsExact);
	const claymoreRooms = Math.round(claymoreRoomsExact);
	const hunterRooms = Math.round(hunterRoomsExact);
	const sonarRooms = Math.round(sonarRoomsExact);
	const raidRooms = Math.round(raidRoomsExact);
	const randomRooms = Math.round(randomRoomsExact);

	const totalRoomsBeforeEmpty =
		hideoutRooms +
		landmineRooms +
		claymoreRooms +
		hunterRooms +
		sonarRooms +
		raidRooms +
		randomRooms +
		Object.keys(hidingRooms).length;

	// Adjust empty rooms to make total equal to roomCount
	const emptyRoomsAdjusted = roomCount - totalRoomsBeforeEmpty;

	let currentRoom = Object.keys(seed).length;

	const usedRoomData = [];

	// Add hideout rooms
	for (let i = 0; i < hideoutRooms; i++) {
		const roomData = getRandomRoomDataByType(
			'hideout',
			usedRoomData,
			seenLevels
		);
		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: 'hideout',
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
	}
	currentRoom += hideoutRooms;

	// Add landmine rooms
	for (let i = 0; i < landmineRooms; i++) {
		const room = getRandomRoomDataByType('landmine', usedRoomData, seenLevels);
		if (room) {
			usedRoomData.push(room.data);
			const uniqueKey = getUniqueKey(room.key);
			seed[uniqueKey] = {
				...room.data,
				type: 'landmine',
				number: currentRoom + i + 1,
				baseKey: room.key,
			};
		}
	}
	currentRoom += landmineRooms;

	// Add claymore rooms
	for (let i = 0; i < claymoreRooms; i++) {
		const roomData = getRandomRoomDataByType(
			'claymore',
			usedRoomData,
			seenLevels
		);
		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: 'claymore',
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
	}
	currentRoom += claymoreRooms;

	// Add hunter rooms
	for (let i = 0; i < hunterRooms; i++) {
		const roomData = getRandomRoomDataByType(
			'hunter',
			usedRoomData,
			seenLevels
		);
		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: 'hunter',
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
	}
	currentRoom += hunterRooms;

	// Add sonar rooms
	for (let i = 0; i < sonarRooms; i++) {
		const roomData = getRandomRoomDataByType('sonar', usedRoomData, seenLevels);
		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: 'sonar',
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
	}
	currentRoom += sonarRooms;

	// Add random rooms- these will select a random type for each room
	for (let i = 0; i < randomRooms; i++) {
		// Select a random room type
		const roomTypes = [
			'hideout',
			'landmine',
			'claymore',
			'hunter',
			'sonar',
			'raid',
		];
		const randomTypeIndex = Math.floor(Math.random() * roomTypes.length);
		const randomType = roomTypes[randomTypeIndex];

		// Get a random room of the selected type
		const roomData = getRandomRoomDataByType(
			randomType,
			usedRoomData,
			seenLevels
		);

		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: randomType,
				...(randomType === 'raid' && { isRaid: true }),
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
	}
	currentRoom += randomRooms;

	// Add empty rooms
	for (let i = 0; i < emptyRoomsAdjusted; i++) {
		const emptyBaseKey = `empty_${i + Object.keys(hidingRooms).length + 1}`;
		const emptyKey = getUniqueKey(emptyBaseKey);
		seed[emptyKey] = {
			type: 'empty',
			number: currentRoom + i + 1,
			baseKey: emptyBaseKey,
		};
	}

	// Add raid rooms
	for (let i = 0; i < raidRooms; i++) {
		const roomData = getRandomRoomDataByType('raid', usedRoomData, seenLevels);

		if (roomData) {
			usedRoomData.push(roomData.data);
			const uniqueKey = getUniqueKey(roomData.key);
			seed[uniqueKey] = {
				...roomData.data,
				type: 'raid',
				isRaid: true,
				number: currentRoom + i + 1,
				baseKey: roomData.key,
			};
		}
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
