export const VISIBLE_POS = [0, 0, 0];
export const HIDDEN_POS = [0, 1000, 0];

export const DEFAULT_DETECTION_SCALE = [0.6, 0.6, 0.6];
export const DETECTION_DISTANCE = 1.5;

export const ROPE_DROP_OFFSET = 2.5;
export const ROPE_DROP_SPEED = 0.02;

export const TASK_TRANSFORMS = {
	Spider1: {
		position: [-1.3, 2.1, -4.7],
		rotation: [Math.PI / 2, 0.3, 0],
	},
	Spider2: {
		position: [1.1, 2.5, -2.15],
		rotation: [0, (-3 * Math.PI) / 4, Math.PI],
	},
	Spider3: {
		position: [1.1, 0.5, -1.8],
		rotation: [-Math.PI / 2, -0.5, 0],
	},
	Footprints: {
		detectionPosition: [-1, 0, -4.7],
		detectionScale: [2, 1, 1.5],
	},
	Handprint: {
		detectionPosition: [-1.75, 1.3, -3.2],
	},
	Bath: {
		detectionPosition: [-1, 0, -4.7],
		detectionScale: [2, 1, 1.5],
	},
	Rope: {
		position: [0.75, 1.75, -2.6],
		rotation: [0, 0, 0],
		scale: 1,
		detectionPosition: [0.75, 1.75, -2.6],
		detectionScale: [0.6, 1.5, 0.6],
	},
	Hangman: {
		position: [-0.64, 1.515, -3.9],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.125,
		detectionPosition: [-0.65, 1.4, -3.9],
	},
	Pentagram: {
		detectionPosition: [0.15, 0, -2.58],
		detectionScale: [1, 1, 1],
	},
	BathWater: {
		detectionPosition: [-1, 0, -4.7],
		detectionScale: [2, 1, 1.5],
	},
	ToiletCloged: {
		detectionPosition: [-1.2, 0, -2.7],
		detectionScale: [0.6, 1, 1.3],
	},
	ToiletPaper: {
		detectionPosition: [-0.5, 0, -2.75],
		detectionScale: [0.6, 1.75, 1.7],
	},
	MannequinSkull: {
		detectionPosition: [-1.3, 0.9, -2.9],
	},
	BathSkull: {
		detectionPosition: [-0.25, 0.35, -4.4],
	},
	Toilets: {
		detectionPosition: [-1.1, 0.25, -2.2],
	},
	ToiletsSkull: {
		detectionPosition: [-1.1, 0.25, -2.2],
	},
	Sink: {
		detectionPosition: [-1.5, 0.8, -3.2],
	},
	SinkWater: {
		detectionPosition: [-1.5, 0.8, -3.2],
	},
	SinkSkull: {
		detectionPosition: [-1.5, 0.8, -3.2],
	},
};

export const DETECTION_FALLBACKS = {
	FloorSplatter: [-0.27, 0, -2.9],
	BathSplatter: [-0.9, 0, -4.3],
	MirrorSplatter: [-1.75, 1.3, -3.2],
};
