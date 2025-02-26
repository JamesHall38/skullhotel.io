import generateSeedData from './generateSeedData';

const generateData = () => {
	const seed = generateSeedData();
	const roomNumber = Object.keys(seed).length;

	return { seed, roomNumber };
};

let { seed, roomNumber } = generateData();

export const regenerateData = () => {
	const data = generateData();
	seed = data.seed;
	roomNumber = data.roomNumber;
};

export { seed, roomNumber };
