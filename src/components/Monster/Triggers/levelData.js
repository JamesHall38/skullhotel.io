const levelData = {
	// HIDING SPOTS
	underBed: {
		probability: 0.1,
		deathReason: 'The client was hiding under the bed',
		position: [1.9, 0, 1.8],
		scale: [2, 1, 1],
		monsterPosition: [1.5, 0, -0.5],
		monsterInitialPosition: [-0.1, 0, 0.5],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'UnderBed',
		cameraShakingScale: [4, 1, 2.5],
		cameraShakingPosition: [0.5, 0, 0.25],
		headOffset: 1.5,
		// hurt: true,
	},

	bathroomVent: {
		probability: 0.1,
		deathReason: 'The client was hiding in the bathroom vent',
		position: [2.5, 0, -1],
		scale: [2, 1, 1],
		monsterPosition: [2.5, 0, -2],
		monsterInitialPosition: [0.8, 0.6, -4.4],
		animation: 'Vent',
	},

	roomVent: {
		probability: 0.1,
		deathReason: 'The client was hiding in the room vent',
		position: [1.5, 0, 4.5],
		scale: [4, 1, 2],
		monsterPosition: [3, 0, 4.6],
		monsterInitialPosition: [3.9, 0.6, 4.85],
		animation: 'Vent',
	},

	bedBasket: {
		probability: 0.1,
		deathReason: 'The client was hiding in the basket near the bed',
		position: [1.9, 0, 1.8],
		scale: [2, 1, 1],
		monsterPosition: [2, 0, -0.5],
		monsterInitialPosition: [-1.36, -0.35, 1.31],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		instantTriggerPosition: [-1.5, -0.93, 1.45],
		instantTriggerScale: [1, 1, 1],
		cameraShakingPosition: [-0.75, 0, 0.75],
		cameraShakingScale: [2.35, 1, 2],
		animation: 'Basket',
	},

	windowBasket: {
		probability: 0.1,
		deathReason: 'The client was hiding in the window basket',
		position: [0, 0, 2.2],
		scale: [6, 1, 2],
		monsterPosition: [-0.6, 0, 2.4],
		monsterInitialPosition: [-1.385, -0.35, 2.2],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		instantTriggerPosition: [-1.5, 0.5, 2.2],
		instantTriggerScale: [1, 1, 1],
		cameraShakingPosition: [-0.75, 0, 2.56],
		cameraShakingScale: [1.94, 1, 1.6],
		animation: 'Basket',
	},

	behindDoor: {
		probability: 0.1,
		deathReason: 'The client was hiding behind the door',
		position: [2.5, 0, -1],
		scale: [3, 1, 1],
		monsterPosition: [4.6, 0, -2.4],
		monsterInitialPosition: [3.9, 0, -4.1],
		instantTriggerPosition: [4.1, 0.5, -4.15],
		instantTriggerScale: [1, 1, 1],
		cameraShakingPosition: [3, 0, -2],
		cameraShakingScale: [2, 1, 2],
		animation: 'BehindDoor',
	},

	// HIDING IN CORNERS
	bathroomCorner: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		monsterPosition: [-1, 0, -3],
		monsterInitialPosition: [-1, 0, -3],
		animation: 'Idle',
		instantTriggerPosition: [0.2, 0, -2.6],
		instantTriggerScale: [2, 2, 1],
		cameraShakingPosition: [2.8, 0, -2.5],
		cameraShakingScale: [2.4, 1, 1.8],
	},

	nearBed: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		monsterPosition: [1.5, 0, 1],
		monsterInitialPosition: [1.5, 0, 1],
		animation: 'Idle',
		instantTriggerPosition: [2.7, 0, -2.6],
		instantTriggerScale: [2, 2, 1],
		cameraShakingPosition: [2.8, 0, -3.8],
		cameraShakingScale: [2.4, 1, 1.8],
	},

	nearWindow: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		monsterPosition: [3.2, 0, 2],
		monsterInitialPosition: [3.2, 0, 2],
		animation: 'BehindDoor',
		instantTriggerPosition: [2.5, 0, -1],
		instantTriggerScale: [2, 2, 1],
		cameraShakingPosition: [2.8, 0, -2.7],
		cameraShakingScale: [2.4, 1, 2.5],
	},

	bedCorner: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [1, 0, -1],
		scale: [1, 1, 1.2],
		monsterPosition: [0.8, 0, -0.3],
		monsterInitialPosition: [-0.8, 0, -1.2],
		animation: 'Idle',
		instantTriggerPosition: [1.5, 0, 0],
		instantTriggerScale: [5, 2, 1],
		cameraShakingPosition: [2.6, 0, -1.15],
		cameraShakingScale: [2.8, 1, 2],
	},

	windowCorner: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [0.2, 0, 2.5],
		scale: [1, 1, 1.2],
		monsterPosition: [0, 0, 3],
		monsterInitialPosition: [-0.8, 0, 2.25],
		animation: 'Idle',
		instantTriggerPosition: [1.5, 0, 3.4],
		instantTriggerScale: [5, 2, 1],
		cameraShakingPosition: [2.1, 0, 2.6],
		cameraShakingScale: [2.8, 1, 2],
	},

	ceilingCornerBeforeBed: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [1, 0, -1],
		monsterPosition: [0.8, 0, -0.3],
		monsterInitialPosition: [-1.18, 0, -1.41],
		monsterInitialRotation: [0.33, 1.34, -0.45],
		animation: 'CeilingCorner',
		instantTriggerPosition: [1.5, 0, -0.4],
		instantTriggerScale: [5, 2, 1],
		cameraShakingPosition: [2.6, 0, -1.15],
		cameraShakingScale: [2.8, 1, 2],
		headOffset: 0.45,
	},

	ceilingCornerCouch: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		monsterPosition: [4.35, -0.25, 2.8],
		monsterInitialPosition: [4.25, -0.3, 1.9],
		monsterInitialRotation: [0, 0, 0],
		animation: 'CeilingCornerReverse',
		instantTriggerPosition: [1.5, 0, 2],
		instantTriggerScale: [5, 2, 1],
		cameraShakingPosition: [0.85, 0, 1.15],
		cameraShakingScale: [4.5, 1, 2],
		headOffset: -1.1,
	},

	behindCouch: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [0, 0, 0],
		scale: [2, 1, 1],
		monsterPosition: [4.3, -0.2, 2.7],
		monsterInitialPosition: [4.03, -1.06, 2.71],
		monsterInitialRotation: [0.43, -2.28, 0.44],
		instantTriggerPosition: [1.9, 0, 2.2],
		instantTriggerScale: [4, 1, 0.8],
		cameraShakingPosition: [0.85, 0, 1.15],
		cameraShakingScale: [4.5, 1, 2],
		animation: 'Vent',
		headOffset: -2.3,
	},

	behindDesk: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [1.9, 0, 0],
		scale: [2, 1, 4],
		monsterPosition: [3, 0, 1],
		monsterInitialPosition: [4.2, -0.1, 1.08],
		monsterInitialRotation: [0, -Math.PI / 2, 0],
		instantTriggerPosition: [1.9, 0, 2.2],
		instantTriggerScale: [4, 1, 0.8],
		cameraShakingPosition: [1, 0, 0.5],
		cameraShakingScale: [5, 1, 3],
		animation: 'Stand',
		headOffset: -Math.PI / 2,
	},

	insideDesk: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [1.9, 0, 0],
		scale: [2, 1, 4],
		monsterPosition: [4, 0, 0.2],
		monsterInitialPosition: [4.2, -0.1, -0.6],
		monsterInitialRotation: [0, -Math.PI / 2, 0],
		instantTriggerPosition: [1.9, 0, 2.2],
		instantTriggerScale: [4, 1, 0.8],
		cameraShakingPosition: [2, 0, 0],
		cameraShakingScale: [3, 1, 6],
		animation: 'Stand',
		headOffset: -Math.PI / 2,
	},

	ceilingCenter: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [1.9, 0, 0],
		scale: [1, 1, 1],
		monsterPosition: [0.4, 10, -0.88],
		monsterInitialPosition: [3.28, 4.47, -1.67],
		monsterInitialRotation: [-1, 0, 0],
		instantTriggerPosition: [3, 0, -1.5],
		instantTriggerScale: [3, 1, 1.5],
		animation: 'Vent',
		roomLight: 'off',
		headOffset: Math.PI,
	},

	// ceilingCenterCrouch: {
	// 	probability: 0.1,
	// 	deathReason: 'If you see the client, run away',
	// 	position: [1.9, 0, 0],
	// 	scale: [1, 1, 1],
	// 	monsterPosition: [0.4, 0.87, -0.88],
	// 	monsterInitialPosition: [1.8, 4, -2.05],
	// 	monsterInitialRotation: [2.6, 0.4, 0.05],
	// 	instantTriggerPosition: [3, 0, -2.3],
	// 	instantTriggerScale: [2.5, 1, 0.8],
	// 	animation: 'Crouch',
	// 	roomLight: 'on',
	// 	headOffset: -Math.PI / 2,
	// },

	// DO NOT OPEN
	windowNoSound: {
		probability: 0.1,
		deathReason: "The client's feet were visible under the curtain",
		monsterPosition: [1.35, 0, 4.8],
		monsterInitialPosition: [1.42, 0, 5.43],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'BehindWindow',
		headOffset: Math.PI,
	},

	windowSound: {
		probability: 0.1,
		deathReason: 'If you hear the client, run away',
		monsterPosition: [1.35, 0, 8],
		monsterInitialPosition: [1.52, 0, 6.3],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'Crouch',
		sound: true,
		headOffset: Math.PI,
	},

	// bathNoSound: {
	// 	probability: 0.1,
	// 	deathReason: 'The client was visible behind the curtain',
	// 	monsterPosition: [1.35, 0, 8],
	// 	monsterInitialPosition: [-0.2, 0, -4.46],
	// 	monsterInitialRotation: [0, Math.PI / 4, 0],
	// 	animation: 'Crouch',
	// },

	bathSound: {
		probability: 0.1,
		deathReason: 'If you hear the client, run away',
		monsterPosition: [1.35, 0, 8],
		monsterInitialPosition: [-1, 0, -4.46],
		monsterInitialRotation: [0, Math.PI / 7, 0],
		animation: 'Crouch',
		sound: true,
		headOffset: Math.PI / 7 + 0.05,
	},

	deskSound: {
		probability: 0.1,
		deathReason: 'If you hear the client, run away',
		monsterPosition: [1.35, 0, 8],
		monsterInitialPosition: [4.06, 0, 0.368],
		monsterInitialRotation: [0, -Math.PI / 2, 0],
		animation: 'Stand',
		sound: true,
		headOffset: -Math.PI / 2,
	},

	nightstandSound: {
		probability: 0.1,
		deathReason: 'If you hear the client, run away',
		monsterPosition: [1.35, 0, 8],
		monsterInitialPosition: [-1.45, 0, -1.28],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Stand',
		sound: true,
		headOffset: Math.PI / 2,
	},

	bathroomSound: {
		probability: 0.1,
		deathReason: 'If you hear the client, run away',
		monsterPosition: [1.35, 0, 8],
		monsterInitialPosition: [0.3, 0, -2.6],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Crouch',
		sound: true,
		headOffset: Math.PI / 2 + 0.05,
	},

	// CLOSE QUICKLY
	quickWindow: {
		probability: 0.1,
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [1.52, 0, 6.3],
		animation: 'Crouch',
	},

	quickBath: {
		probability: 0.1,
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [-0.8, 0, -4.45],
		animation: 'Crouch',
	},

	quickDesk: {
		probability: 0.1,
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [4.06, 0, 0.368],
		monsterInitialRotation: [0, -Math.PI / 2, 0],
		animation: 'Stand',
		headOffset: -Math.PI / 2,
	},

	quickNightstand: {
		probability: 0.1,
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [-1.45, 0, -1.28],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Stand',
		headOffset: Math.PI / 2,
	},

	quickBathroom: {
		probability: 0.1,
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [0.3, 0, -2.6],
		animation: 'Crouch',
	},

	// DO NOT LOOK
	bloodOnBath: {
		probability: 0.1,
		deathReason: 'Do not look at the client',
		position: [-0.75, 0, -3.2],
		scale: [2, 1, 2],
		monsterPosition: [-0.75, 1.8, -4.2],
		monsterInitialPosition: [-0.65, -0.27, -4.2],
		animation: 'BathCeiling',
	},

	bloodOnDoor: {
		probability: 0.1,
		deathReason: 'Do not look at the client',
		position: [2.75, 0, -3.55],
		scale: [1.5, 1, 1.5],
		monsterPosition: [2.75, 8, -3.55],
		monsterInitialPosition: [3, -0.27, -4],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'DoorCeiling',
	},

	// bloodOnBathroom: {
	// 	probability: 0.1,
	// 	deathReason: 'Do not look at the client',
	// 	position: [-0.75, 0, -3.2],
	// 	scale: [2, 1, 2],
	// },

	// RUNNING
	runningWindowToDoor: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [2.85, 0, -4.4],
		scale: [2.5, 0.5, 3],
		monsterPosition: [2, 0, 4],
		monsterInitialPosition: [1, 0, 4],
		animation: 'Idle',
	},

	runningWindowCurtainToBed: {
		probability: 0.1,
		deathReason: 'If you see the client, run away',
		position: [2, 0, 1.5],
		scale: [2.5, 0.5, 2],
		monsterPosition: [1.5, 0, 4],
		monsterInitialPosition: [-0.5, 0, 2.3],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Idle',
	},

	// runningBedToBath: {
	// 	probability: 0.1,
	// 	deathReason: 'If you see the client, run away',
	// 	position: [1.5, 0, -1.5],
	// 	scale: [2, 0.5, 2],
	// 	monsterPosition: [1.5, 0, -4],
	// 	monsterInitialPosition: [1.5, 0, -4],
	// 	animation: 'Idle',
	// },

	// runningBathToDoor: {
	// 	probability: 0.1,
	// 	deathReason: 'If you see the client, run away',
	// 	position: [2.75, 0, -2],
	// 	scale: [2, 0.5, 3],
	// 	monsterPosition: [2, 0, -4],
	// 	monsterInitialPosition: [2, 0, -4],
	// 	animation: 'Idle',
	// },
};

export default levelData;