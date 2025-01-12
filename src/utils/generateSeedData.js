import levelData from '../components/Monster/Triggers/levelData';

const numberOfRooms = 20;

function getHidingRooms() {
	return {
		empty_1: { type: 'empty', number: 1 },
		hiding_1: {
			type: 'empty',
			number: 2,
			hideObjective: 'window',
			hideSpot: 'roomCurtain',
		},
		hiding_2: {
			type: 'empty',
			number: 3,
			hideObjective: 'bedsheets',
			hideSpot: 'desk',
		},
		hiding_3: {
			type: 'empty',
			number: 4,
			hideObjective: 'bottles',
			hideSpot: 'bathroomCurtain',
		},
	};
}

export default function generateSeedData(
	isTestMode = false,
	selectedRoom = null
) {
	if (selectedRoom && levelData[selectedRoom]) {
		return {
			[selectedRoom]: {
				...levelData[selectedRoom],
				type: selectedRoom,
			},
		};
	}

	if (isTestMode) {
		let selectedRooms = getHidingRooms();
		let allNonEmptyRooms = Object.entries(levelData).flat();

		allNonEmptyRooms.forEach((room, index) => {
			if (Array.isArray(room)) return; // Skip array entries
			if (index < 5) return; // Skip first 5 rooms which are hiding rooms
			selectedRooms[`${room.type || 'room'}_${index}`] = { ...room };
		});

		return selectedRooms;
	}

	const numberOfEmptyRooms = Math.floor(numberOfRooms * 0.5);
	const numberOfFilledRooms = numberOfRooms - numberOfEmptyRooms;
	const hidingRooms = getHidingRooms();

	let selectedRooms = { ...hidingRooms };
	let allNonEmptyRooms = Object.entries(levelData);
	allNonEmptyRooms.sort(() => Math.random() - 0.5);

	// Ensure one room from each category
	for (let categoryIndex = 0; categoryIndex < 5; categoryIndex++) {
		const categoryRoom = allNonEmptyRooms.find(
			([key, room]) => room.type === categoryIndex
		);
		if (categoryRoom) {
			const [key, room] = categoryRoom;
			selectedRooms[key] = room;
			allNonEmptyRooms = allNonEmptyRooms.filter(([k]) => k !== key);
		}
	}

	// Fill remaining rooms
	let currentIndex = Object.keys(selectedRooms).length;
	while (currentIndex < numberOfFilledRooms && allNonEmptyRooms.length > 0) {
		const randomIndex = Math.floor(Math.random() * allNonEmptyRooms.length);
		const [key, room] = allNonEmptyRooms[randomIndex];
		selectedRooms[key] = room;
		allNonEmptyRooms.splice(randomIndex, 1);
		currentIndex++;
	}

	// Modify empty rooms loop to account for hiding rooms
	for (
		let i = 0;
		i < numberOfEmptyRooms - Object.keys(hidingRooms).length;
		i++
	) {
		selectedRooms[`empty_${i + 5}`] = { type: 'empty', number: i + 5 };
	}

	// Randomize order
	const entries = Object.entries(selectedRooms);
	entries.sort(() => Math.random() - 0.5);

	return Object.fromEntries(entries);
}
