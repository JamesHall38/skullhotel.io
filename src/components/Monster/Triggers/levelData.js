const levelData = {
	// HIDEOUT
	underBed: {
		type: 'hideout',
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
	},

	bathroomVent: {
		type: 'hideout',
		deathReason: 'The client was hiding in the bathroom vent',
		position: [2.5, 0, -2.2],
		scale: [2, 1, 2],
		monsterPosition: [2.5, 0, -2],
		monsterInitialPosition: [0.8, 0.6, -4.4],
		animation: 'Vent',
	},

	roomVent: {
		type: 'hideout',
		deathReason: 'The client was hiding in the room vent',
		position: [1.5, 0, 4.5],
		scale: [4, 1, 2],
		monsterPosition: [3, 0, 4.6],
		monsterInitialPosition: [3.9, 0.6, 4.85],
		animation: 'Vent',
	},

	bedBasket: {
		type: 'hideout',
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
		headOffset: Math.PI / 2,
	},

	windowBasket: {
		type: 'hideout',
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
		headOffset: Math.PI / 2,
	},

	hideoutMirror: {
		type: 'hideout',
		deathReason: 'If you see the client in the mirror, run away',
		position: [2.5, 0, -2.2],
		scale: [2, 1, 2],
		monsterPosition: [2.5, 0, -2],
		monsterInitialPosition: [-5.2, 0, -2.5],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Idle',
		headOffset: Math.PI / 2,
	},

	behindDoor: {
		type: 'hideout',
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

	// LANDMINE

	landmineMirror: {
		type: 'landmine',
		deathReason: 'If you see the client in the mirror, run away',
		position: [0.5, 0, -2.8],
		scale: [2, 1, 1],
		monsterPosition: [-3, -0.3, -3.3],
		monsterInitialPosition: [-3, -0.3, -3.3],
		animation: 'Idle',
		instantTriggerPosition: [0.5, 0, -2.3],
		instantTriggerScale: [2, 2, 1],
	},

	nearWindow: {
		type: 'landmine',
		deathReason: 'If you see the client, run away',
		monsterPosition: [3.2, 0, 2],
		monsterInitialPosition: [3.2, 0, 2],
		animation: 'BehindDoor',
		instantTriggerPosition: [2.5, 0, -1],
		instantTriggerScale: [2, 2, 1],
		cameraShakingPosition: [2.8, 0, -2.7],
		cameraShakingScale: [2.4, 1, 2.5],
	},

	ceilingCornerCouch: {
		type: 'landmine',
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
		type: 'landmine',
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
		type: 'landmine',
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
		type: 'landmine',
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
		type: 'landmine',
		deathReason: 'If you see the client, run away',
		instantTriggerPosition: [2.9, 0, -1.5],
		instantTriggerScale: [3.3, 1, 1],
		monsterInitialPosition: [3.01, 2.02, -1.21],
		monsterInitialRotation: [0, 1.61, 0],
		animation: 'Ceiling',
	},

	bedCorner: {
		type: 'landmine',
		deathReason: 'If you see the client, run away',
		position: [1, 0, -1],
		scale: [1, 1, 1.2],
		monsterPosition: [0.25, 0, -0.66],
		monsterInitialPosition: [-0.07, 1.17, -1.5],
		monsterInitialRotation: [0, -1.64, Math.PI],
		animation: 'Ceiling',
		instantTriggerPosition: [1.5, 0, -0.53],
		instantTriggerScale: [5, 2, 1],
		cameraShakingPosition: [2.61, 0, -1],
		cameraShakingScale: [4, 1, 2],
	},

	// SONAR

	sonarBathroom: {
		type: 'sonar',
		deathReason:
			'do not open the bathroom door if there is noises coming from inside',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [0.3, 0, -2.6],
		animation: 'Crouch',
		sound: true,
	},

	// sonarWindow: {
	// 	type: 'sonar',
	// 	deathReason: 'If you hear the client, run away',
	// 	monsterPosition: [1.35, 0, 8],
	// 	monsterInitialPosition: [1.52, 0, 6.3],
	// 	monsterInitialRotation: [0, Math.PI, 0],
	// 	animation: 'Crouch',
	// 	sound: true,
	// 	headOffset: Math.PI,
	// },

	// sonarBath: {
	// 	type: 'sonar',
	// 	deathReason: 'If you hear the client, run away',
	// 	monsterPosition: [1.35, 0, 8],
	// 	monsterInitialPosition: [-1, 0, -4.46],
	// 	monsterInitialRotation: [0, Math.PI / 7, 0],
	// 	animation: 'Crouch',
	// 	sound: true,
	// 	headOffset: Math.PI / 7 + 0.05,
	// },

	// sonarDesk: {
	// 	type: 'sonar',
	// 	deathReason: 'If you hear the client, run away',
	// 	monsterPosition: [1.35, 0, 8],
	// 	monsterInitialPosition: [4.06, 0, 0.368],
	// 	monsterInitialRotation: [0, -Math.PI / 2, 0],
	// 	animation: 'Stand',
	// 	sound: true,
	// 	headOffset: -Math.PI / 2,
	// },

	// sonarNightstand: {
	// 	type: 'sonar',
	// 	deathReason: 'If you hear the client, run away',
	// 	monsterPosition: [1.35, 0, 8],
	// 	monsterInitialPosition: [-1.45, 0, -1.28],
	// 	monsterInitialRotation: [0, Math.PI / 2, 0],
	// 	animation: 'Stand',
	// 	sound: true,
	// 	headOffset: Math.PI / 2,
	// },

	// CLAYMORE
	// claymoreWindow: {
	// 	type: 'claymore',
	// 	deathReason: 'Close quickly before the client attacks you',
	// 	monsterPosition: [0, 0, 10],
	// 	monsterInitialPosition: [1.52, 0, 6.3],
	// 	animation: 'Crouch',
	// },

	// claymoreBath: {
	// 	type: 'claymore',
	// 	deathReason: 'Close quickly before the client attacks you',
	// 	monsterPosition: [0, 0, 10],
	// 	monsterInitialPosition: [-0.8, 0, -4.45],
	// 	animation: 'Crouch',
	// },

	claymoreDesk: {
		type: 'claymore',
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [4.06, 0, 0.368],
		monsterInitialRotation: [0, -Math.PI / 2, 0],
		animation: 'Stand',
		headOffset: -Math.PI / 2,
	},

	claymoreNightstand: {
		type: 'claymore',
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [-1.45, 0, -1.28],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Stand',
		headOffset: Math.PI / 2,
	},

	claymoreBathroom: {
		type: 'claymore',
		deathReason: 'Close quickly before the client attacks you',
		monsterPosition: [0, 0, 10],
		monsterInitialPosition: [0.3, 0, -2.6],
		animation: 'Crouch',
	},

	claymoreFootWindow: {
		type: 'claymore',
		deathReason: "The client's feet were visible under the curtain",
		monsterPosition: [1.35, 0, 4.85],
		monsterInitialPosition: [1.45, 0, 5.5],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'BehindWindow',
		headOffset: Math.PI,
	},

	// HUNTER
	hunterLivingRoom: {
		type: 'hunter',
		deathReason: 'If you see the client, run away',
		position: [2, 0, 1.5],
		scale: [2.5, 0.5, 2],
		monsterPosition: [1.5, 0, 4],
		monsterInitialPosition: [-0.5, 0, 2.3],
		monsterInitialRotation: [0, Math.PI / 1.75, 0],
		animation: 'Idle',
	},

	hunterCeilingLivingRoom: {
		type: 'hunter',
		deathReason: 'If you see the client, run away',
		position: [2, 0, 1.5],
		scale: [2.5, 0.5, 2],
		monsterPosition: [1.5, 0, 4],
		monsterInitialPosition: [-1, 0, 2.3],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'CeilingCrawlIdle',
		ceiling: true,
		headOffset: Math.PI / 1.5,
	},

	hunterCeilingCouch: {
		type: 'hunter',
		deathReason: 'If you see the client, run away and close behind you',
		position: [2.5, 0, -0.6],
		scale: [2.5, 0.5, 2],
		monsterPosition: [1.5, 0, 4],
		monsterInitialPosition: [3.8, 0, 2.6],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'CeilingCrawlIdle',
		ceiling: true,
		headOffset: Math.PI,
	},

	hunterNightstand: {
		type: 'hunter',
		deathReason: 'If you see the client, run away and close behind you',
		position: [2.5, 0, -0.6],
		scale: [2.5, 0.5, 2],
		monsterPosition: [-1.4, 0, -1.2],
		monsterInitialPosition: [-1.45, 0, -1.28],
		monsterInitialRotation: [0, Math.PI / 2, 0],
		animation: 'Stand',
		headOffset: Math.PI / 2,
	},

	hunterWindow: {
		type: 'hunter',
		deathReason: 'If you see the client, run away and close behind you',
		position: [2.5, 0, -0.6],
		scale: [2.5, 0.5, 2],
		monsterPosition: [1.5, 0, 6],
		monsterInitialPosition: [1.52, 0, 5.7],
		monsterInitialRotation: [0, Math.PI, 0],
		animation: 'BehindWindow',
	},

	// RAID
	raidWindow: {
		type: 'raid',
		deathReason: 'If you hear knocking, hide',
		hideObjective: 'window',
		hideSpot: 'window',
	},

	raidBedsheets: {
		type: 'raid',
		deathReason: 'If you hear knocking, hide',
		hideObjective: 'bedsheets',
		hideSpot: 'bedsheets',
	},

	raidBottles: {
		type: 'raid',
		deathReason: 'If you hear knocking, hide',
		hideObjective: 'bottles',
		hideSpot: 'bottles',
	},

	raidTV: {
		type: 'raid',
		deathReason: 'If you hear the tv playing by itself, hide',
		signal: 'tv',
		position: [2, 0, 1.5],
		scale: [2.5, 0.5, 2],
	},

	raidRadio: {
		type: 'raid',
		deathReason: 'If you hear the radio playing by itself, hide',
		signal: 'radio',
		position: [2.5, 0, -0.6],
		scale: [2.5, 0.5, 2],
	},

	raidInscriptions: {
		type: 'raid',
		deathReason: 'If you see blood inscriptions on the walls, hide',
		signal: 'inscriptions',
		position: [2, 0, 1.5],
		scale: [2.5, 0.5, 2],
	},
};

export default levelData;
