import levelData from '../components/Monster/Triggers/levelData';

const numberOfRooms = 20;

export default function generateSeedData(
	isTestMode = false,
	selectedRoom = null
) {
	if (selectedRoom && levelData[selectedRoom]) {
		let selectedRooms = {};
		const roomData = levelData[selectedRoom];

		for (let i = 0; i < numberOfRooms; i++) {
			selectedRooms[`${selectedRoom}_${i}`] = {
				...roomData,
				type: selectedRoom,
				number: i,
			};
		}

		return selectedRooms;
	}

	if (isTestMode) {
		let selectedRooms = {};
		let allNonEmptyRooms = Object.entries(levelData).flat();

		allNonEmptyRooms.forEach((room, index) => {
			if (Array.isArray(room)) return; // Skip array entries
			selectedRooms[`${room.type || 'room'}_${index}`] = { ...room };
		});

		return selectedRooms;
	}

	const numberOfEmptyRooms = Math.floor(numberOfRooms * 0.5);
	const numberOfFilledRooms = numberOfRooms - numberOfEmptyRooms;

	let selectedRooms = {};
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

	// Add empty rooms
	for (let i = 0; i < numberOfEmptyRooms; i++) {
		selectedRooms[`empty_${i}`] = { type: 'empty', number: i };
	}

	// Randomize order
	const entries = Object.entries(selectedRooms);
	entries.sort(() => Math.random() - 0.5);

	return Object.fromEntries(entries);
}
