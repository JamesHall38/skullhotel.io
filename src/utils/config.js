import generateEvents from './generateEvents';
import generateSeedData from './generateSeedData';

const generateData = () => {
	const seed = generateSeedData();
	const roomNumber = Object.keys(seed).length;
	const events = generateEvents();

	return { events, seed, roomNumber };
};

let { events, seed, roomNumber } = generateData();

export const regenerateData = () => {
	const data = generateData();
	events = data.events;
	seed = data.seed;
	roomNumber = data.roomNumber;
};

export { events, seed, roomNumber };
