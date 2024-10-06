import levelData from '../data/levelData';

function getRandomRoom(levels, categoryIndex) {
	const totalProbability = levels.reduce(
		(sum, room) => sum + room.probability,
		0
	);
	const random = Math.random() * totalProbability;
	let cumulativeProbability = 0;

	for (let i = 0; i < levels.length; i++) {
		const room = levels[i];
		cumulativeProbability += room.probability;
		if (random < cumulativeProbability) {
			return { ...room, type: Math.floor(Math.random() * 6), number: i };
		}
	}
	const lastIndex = levels.length - 1;
	return { ...levels[lastIndex], type: categoryIndex, number: lastIndex };
}

function getEveryRoomInSingle() {
	let selectedRooms = [];
	for (let i = 0; i < 20; i++) {
		if (levelData[0][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[0][i], number: i, type: 0 });
		}
	}
	for (let i = 0; i < 20; i++) {
		if (levelData[1][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[1][i], number: i, type: 1 });
		}
	}
	for (let i = 0; i < 20; i++) {
		if (levelData[2][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[2][i], number: i, type: 2 });
		}
	}
	for (let i = 0; i < 20; i++) {
		if (levelData[3][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[3][i], number: i, type: 3 });
		}
	}
	for (let i = 0; i < 20; i++) {
		if (levelData[4][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[4][i], number: i, type: 4 });
		}
	}
	for (let i = 0; i < 20; i++) {
		if (levelData[5][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[5][i], number: i, type: 5 });
		}
	}
	return selectedRooms;
}

function getEveryRoomInDouble() {
	let selectedRooms = [];
	selectedRooms.push(...getEveryRoomInSingle());
	selectedRooms.push(...getEveryRoomInSingle());
	return selectedRooms;
}

function getTypeRoomsInSingle(type) {
	let selectedRooms = [];
	for (let i = 0; i < 20; i++) {
		if (levelData[type][i]?.probability > 0) {
			selectedRooms.push({ ...levelData[type][i], type: type, number: i });
		}
	}
	return selectedRooms;
}

function getTypeRoomsInDouble(type) {
	let selectedRooms = [];
	selectedRooms.push(...getTypeRoomsInSingle(type));
	selectedRooms.push(...getTypeRoomsInSingle(type));
	return selectedRooms;
}

// TEST VERSION
// export default function generateSeedData() {
// 	let selectedRooms = [];

// 	// selectedRooms.push(...getEveryRoomInDouble());
// 	selectedRooms.push(...getTypeRoomsInDouble(0));
// 	// selectedRooms.push(...getTypeRoomsInDouble(1));
// 	// selectedRooms.push(...getTypeRoomsInDouble(2));
// 	// selectedRooms.push(...getTypeRoomsInDouble(3));
// 	// selectedRooms.push(...getTypeRoomsInDouble(4));
// 	// selectedRooms.push(...getTypeRoomsInDouble(5));

// 	return selectedRooms;
// }

const emptyRoomPercentage = 0.5;
const numberOfRooms = 20;

export default function generateSeedData() {
	const numberOfEmptyRooms = Math.floor(numberOfRooms * emptyRoomPercentage);
	const numberOfFilledRooms = numberOfRooms - numberOfEmptyRooms;

	let selectedRooms = [];

	let allNonEmptyRooms = [];
	levelData.forEach((category, categoryIndex) => {
		category.forEach((room, roomIndex) => {
			allNonEmptyRooms.push({
				...room,
				type: categoryIndex,
				number: roomIndex,
			});
		});
	});

	for (let i = 0; i < numberOfFilledRooms; i++) {
		selectedRooms.push(allNonEmptyRooms[i]);
	}

	for (let i = 0; i < numberOfEmptyRooms; i++) {
		selectedRooms.push({ empty: true, type: 'empty', number: i });
	}

	selectedRooms = selectedRooms.sort(() => Math.random() - 0.5);

	return selectedRooms;
}
