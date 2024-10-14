const levelData = [
	[
		// HIDING SPOTS // 0
		{
			probability: 0.1,
			deathReason: 'The client was hiding under the bed',
			position: [1.9, 0, 1.8],
			scale: [2, 1, 1],
			monsterPosition: [1.5, 0, -0.5],
			monsterInitialPosition: [-0.25, 0, 0.5],
			animation: 'UnderBed',
			hurt: true,
			trigger: {
				objective: 2,
			},
		}, // under the bed // 0 // door 1
		{
			probability: 0.1,
			deathReason: 'The client was hiding in the bathroom vent',
			position: [2.5, 0, -1],
			scale: [2, 1, 1],
			monsterPosition: [2.5, 0, -2],
			monsterInitialPosition: [0.8, 0.6, -4.4],
			animation: 'Vent',
			trigger: {
				objective: 0,
				bathroomDoor: true,
			},
		}, // bathroom vent // 1 // door 2
		{
			probability: 0.1,
			deathReason: 'The client was hiding in the room vent',
			position: [1.5, 0, 4.5],
			scale: [4, 1, 2],
			monsterPosition: [3, 0, 4.6],
			monsterInitialPosition: [3.9, 0.6, 4.85],
			animation: 'Vent',
			trigger: {
				objective: 2,
			},
		}, // room vent // 2 // door 3
		{
			probability: 0.1,
			deathReason: 'The client was hiding in the bed basket',
			position: [1.9, 0, 1.8],
			scale: [2, 1, 1],
			monsterPosition: [2, 0, -0.5],
			monsterInitialPosition: [-1.3, 0.1, 1.32],
			dangerZonePosition: [-0.5, 0, 0.5],
			dangerZoneScale: [2, 1, 2],
			animation: 'Basket',
			trigger: {
				objective: 2,
			},
		}, // bed basket // 3 // door 4
		{
			probability: 0.1,
			deathReason: 'The client was hiding in the window basket',
			position: [0, 0, 2.2],
			scale: [6, 1, 2],
			monsterPosition: [-0.6, 0, 2.4],
			monsterInitialPosition: [-1.4, 0.1, 2.25],
			dangerZonePosition: [-0.5, 0, 2.35],
			dangerZoneScale: [1, 1, 1],
			animation: 'Basket',
			trigger: {
				objective: 2,
			},
		}, // window basket // 4 // door 5
		{
			probability: 0.1,
			deathReason: 'The client was hiding behind the door',
			position: [2.5, 0, -1],
			scale: [3, 1, 1],
			monsterPosition: [4.6, 0, -2.4],
			monsterInitialPosition: [3.9, 0, -4],
			dangerZonePosition: [3, 0, -2],
			dangerZoneScale: [2, 1, 2],
			animation: 'BehindDoor',
			trigger: {
				objective: 2,
			},
		}, // behind door // 5 // door 6
	],
	[
		// HIDING IN CORNERS // 1
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			monsterPosition: [-1, 0, -3],
			monsterInitialPosition: [-1, 0, -3],
			animation: 'Idle',
			instantTriggerPosition: [0.2, 0, -2.6],
			instantTriggerScale: [2, 2, 1],
			dangerZonePosition: [2.8, 0, -2.5],
			dangerZoneScale: [2.4, 1, 1.8],
		}, // bathroom // 0 // door 7
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			monsterPosition: [1.5, 0, 1],
			monsterInitialPosition: [1.5, 0, 1],
			animation: 'Idle',
			instantTriggerPosition: [2.7, 0, -2.6],
			instantTriggerScale: [2, 2, 1],
			dangerZonePosition: [2.8, 0, -3.8],
			dangerZoneScale: [2.4, 1, 1.8],
		}, // close to the bed // 1 // door 8
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			monsterPosition: [3.2, 0, 2],
			monsterInitialPosition: [3.2, 0, 2],
			animation: 'BehindDoor',
			instantTriggerPosition: [2.5, 0, -1],
			instantTriggerScale: [2, 2, 1],
			dangerZonePosition: [2.8, 0, -2.7],
			dangerZoneScale: [2.4, 1, 2.5],
		}, // close to the window // 2 // door 9
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1, 0, -1],
			scale: [1, 1, 1.2],
			monsterPosition: [0.8, 0, -0.3],
			monsterInitialPosition: [-0.8, 0, -1.2],
			animation: 'Idle',
			instantTriggerPosition: [1.5, 0, 0],
			instantTriggerScale: [5, 2, 1],
			dangerZonePosition: [2.6, 0, -1.15],
			dangerZoneScale: [2.8, 1, 2],
			// trigger: {
			// 	monster: true,
			// },
		}, // bed corner // 3 // door 10
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [0.2, 0, 2.5],
			scale: [1, 1, 1.2],
			monsterPosition: [0, 0, 3],
			monsterInitialPosition: [-0.8, 0, 2.25],
			animation: 'Idle',
			instantTriggerPosition: [1.5, 0, 3.4],
			instantTriggerScale: [5, 2, 1],
			dangerZonePosition: [2.1, 0, 2.6],
			dangerZoneScale: [2.8, 1, 2],
			// trigger: {
			// 	monster: true,
			// },
		}, // window corner // 4 // door 11
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1, 0, -1],
			monsterPosition: [0.8, 0, -0.3],
			monsterInitialPosition: [-1.15, 0, -1.55],
			// monsterInitialRotation: [0, Math.PI, 0],
			animation: 'CeilingCorner',
			instantTriggerPosition: [1.5, 0, -0.4],
			instantTriggerScale: [5, 2, 1],
			dangerZonePosition: [2.6, 0, -1.15],
			dangerZoneScale: [2.8, 1, 2],
			trigger: {
				// frozen: true,
				// monster: true,
			},
		}, // ceiling corner before bed // 5 // door 12
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			monsterPosition: [4.35, -0.25, 2.8],
			monsterInitialPosition: [4.22, -0.25, 1.9],
			monsterInitialRotation: [0, 0, 0],
			animation: 'CeilingCornerReverse',
			instantTriggerPosition: [1.5, 0, 2],
			instantTriggerScale: [5, 2, 1],
			trigger: {
				frozen: true,
			},
		}, // ceiling corner couch // 6 // door 13
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [0, 0, 0],
			scale: [2, 1, 1],
			monsterPosition: [4.3, -0.2, 2.7],
			monsterInitialPosition: [4.3, -0.08, 2.7],
			instantTriggerPosition: [1.9, 0, 2.2],
			instantTriggerScale: [4, 1, 0.8],
			animation: 'Stand',
			trigger: {
				objective: 2,
			},
		}, // behind couch // 7 // door 14
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1.9, 0, 0],
			scale: [2, 1, 4],
			monsterPosition: [3, 0, 1],
			monsterInitialPosition: [4.2, -0.1, 1.08],
			instantTriggerPosition: [3.2, 0.5, 1],
			instantTriggerScale: [1, 1, 0.8],
			dangerZonePosition: [2, 0, 0.5],
			dangerZoneScale: [2.6, 1, 3],
			animation: 'Stand',
			trigger: {
				objective: 1,
			},
		}, // behind desk // 8 // door 15
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1.9, 0, 0],
			scale: [2, 1, 4],
			monsterPosition: [3, 0, -0.6],
			monsterInitialPosition: [4.2, -0.1, -0.6],
			instantTriggerPosition: [3.2, 0.5, -0.6],
			instantTriggerScale: [1, 1, 0.8],
			dangerZonePosition: [2, 0, 0],
			dangerZoneScale: [2.6, 1, 3],
			animation: 'Stand',
			trigger: {
				objective: 1,
			},
		}, // inside desk // 9 // door 16
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1.9, 0, 0],
			scale: [1, 1, 1],
			monsterPosition: [0.4, 0.87, -0.88],
			monsterInitialPosition: [3, 3.2, -0.8],
			monsterInitialRotation: [2.2, 0, Math.PI],
			instantTriggerPosition: [3, 0, -1.5],
			instantTriggerScale: [2.5, 1, 1],
			animation: 'CeilingCrawlIdle',
			roomLight: 'off',
			trigger: {
				objective: 1,
				frozen: true,
			},
		}, // ceiling center // 10 // door 17
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1.9, 0, 0],
			scale: [1, 1, 1],
			monsterPosition: [0.4, 0.87, -0.88],
			monsterInitialPosition: [1.8, 4, -2.05],
			monsterInitialRotation: [2.6, 0.4, 0.05],
			instantTriggerPosition: [3, 0, -2.3],
			instantTriggerScale: [2.5, 1, 0.8],
			animation: 'Crouch',
			roomLight: 'on',
			trigger: {
				objective: 1,
				frozen: true,
			},
		}, // ceiling center // 11 // door 18
	],
	[
		// DO NOT OPEN // 2
		{
			probability: 0.1,
			deathReason: "The client's feet were visible under the curtain",
			monsterPosition: [1.35, 0, 4.8],
			monsterInitialPosition: [1.3, 0, 5.21],
			monsterInitialRotation: [0, Math.PI, 0],
			animation: 'BehindWindow',
			trigger: {
				window: true,
			},
		}, // window no sound // 0 // door 19
		{
			probability: 0.1,
			deathReason: 'If you hear the client, run away',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [1, 0, 5.8],
			monsterInitialRotation: [0, Math.PI, 0],
			animation: 'Crouch',
			sound: true,
			trigger: {
				window: true,
			},
		}, // window sound // 1 // door 20
		{
			probability: 0.1,
			deathReason: 'The client was visible behind the curtain',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [-0.2, 0, -4.46],
			monsterInitialRotation: [0, Math.PI / 4, 0],
			animation: 'Crouch',
			trigger: {
				bath: true,
			},
		}, // bath no sound // 2 // door 21
		{
			probability: 0.1,
			deathReason: 'If you hear the client, run away',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [-1, 0, -4.46],
			monsterInitialRotation: [0, Math.PI / 7, 0],
			animation: 'Crouch',
			sound: true,
			trigger: {
				bath: true,
			},
		}, // bath sound // 3 // door 22
		{
			probability: 0.1,
			deathReason: 'If you hear the client, run away',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [4.06, -0.0, 0.368],
			monsterInitialRotation: [0, -Math.PI / 2, 0],
			animation: 'Stand',
			sound: true,
			trigger: {
				desk: true,
			},
		}, // desk sound // 4 // door 23
		{
			probability: 0.1,
			deathReason: 'If you hear the client, run away',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [-1.45, 0.1, -1.28],
			monsterInitialRotation: [0, Math.PI / 2, 0],
			animation: 'Stand',
			sound: true,
			trigger: {
				bed: true,
			},
		}, // nightstand sound // 5 // door 24
		// {
		// 	probability: 0.1,
		// 	monsterPosition: [1.35, 0, 8],
		// 	monsterInitialPosition: [2.7, 0, -3],
		// 	monsterInitialRotation: [0, -Math.PI, 0],
		// 	animation: 'Crouch',
		// 	sound: true,
		// 	trigger: {
		// 		door: true,
		// 	},
		// }, // door sound // 6 // door 25
		{
			probability: 0.1,
			deathReason: 'If you hear the client, run away',
			monsterPosition: [1.35, 0, 8],
			monsterInitialPosition: [0.3, 0, -2.6],
			monsterInitialRotation: [0, Math.PI / 2, 0],
			animation: 'Crouch',
			sound: true,
			trigger: {
				bathroom: true,
			},
		}, // bathroom sound // 7 // door 25
	],
	[
		// CLOSE QUICKLY // 3
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [1, 0, 5.8],
			animation: 'Crouch',
			trigger: {
				window: true,
			},
		}, // window // 0 // door 26
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [-0.8, 0, -4.45],
			animation: 'Crouch',
			trigger: {
				bath: true,
			},
		}, // bath // 1 // door 27
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [4.06, -0.0, 0.368],
			animation: 'Stand',
			trigger: {
				desk: true,
			},
		}, // desk // 2 // door 28
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [-1.45, 0, -1.32],
			animation: 'Stand',
			trigger: {
				bed: true,
			},
		}, // night stand // 3 // door 29
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [2.7, 0, -3],
			animation: 'Crouch',
			trigger: {
				door: true,
			},
		}, // door // 4 // door 30
		{
			probability: 0.1,
			deathReason: 'Close quickly before the client attacks you',
			monsterPosition: [0, 0, 10],
			monsterInitialPosition: [0.3, 0, -2.6],
			animation: 'Crouch',
			trigger: {
				bathroom: true,
			},
		}, // bathroom // 5 // door 31
	],
	[
		// DO NOT LOOK // 4
		{
			probability: 0.1,
			deathReason: 'Do not look at the client',
			position: [-0.75, 0, -3.2],
			scale: [2, 1, 2],
			monsterPosition: [-0.75, 1.8, -4.2],
			monsterInitialPosition: [-0.65, -0.27, -4.2],
			// monsterInitialRotation: [0, 0, 0],
			animation: 'BathCeiling',
			trigger: {
				bath: true,
				objective: 0,
			},
		}, // blood on the bath // 0 // door 32
		{
			probability: 0.1,
			deathReason: 'Do not look at the client',
			position: [2.9, 0, -3.7],
			scale: [2, 1, 2],
			monsterPosition: [2.9, 1.8, -4.2],
			monsterInitialPosition: [2.9, -0.27, -4.2],
			monsterInitialRotation: [0, -Math.PI - 0.4, 0],
			animation: 'DoorCeiling',
			trigger: {
				door: true,
			},
		}, // blood on the door // 1 // door 33
		{
			probability: 0.1,
			deathReason: 'Do not look at the client',
			position: [0.4, 0, -2.8],
			scale: [1, 1, 1],
			monsterPosition: [1.05, 1.8, -2.45],
			monsterInitialPosition: [1.05, -0.27, -2.45],
			monsterInitialRotation: [0, (3 * Math.PI) / 8 + 0.1, 0],
			animation: 'DoorCeiling',
			trigger: {
				bathroom: true,
			},
		}, // blood on the bathroom door // 2 // door 34

		{
			probability: 0.1,
			deathReason: 'Do not look at the client',
			position: [0, 0, -3],
			scale: [2, 1, 2],
			monsterPosition: [2.5, 0, -1.5],
			monsterInitialPosition: [-3, -0.1, -3.35],
			monsterInitialRotation: [0, Math.PI / 2, 0],
			animation: 'Idle',
			trigger: {
				monster: true,
				objective: 1,
				bathroomDoor: true,
			},
		}, // mirror 1 : very visible, kills when you enter the bathroom // 3 // door 35
		// {
		// 	probability: 0.1,
		// 	position: [2.5, 0, -1],
		// 	scale: [2, 1, 1],
		// 	monsterPosition: [-6.5, 0, -2.2],
		// 	monsterInitialPosition: [-6.5, 0, -2.2],
		// 	monsterInitialRotation: [0, 1.4, 0],
		// 	animation: 'Idle',
		// 	trigger: {
		// 		objective: 1,
		// 		bathroomDoor: true,
		// 	},
		// }, // mirror 2 : gets closer when you dont look at it // 4 // door 37
		// {
		// 	probability: 0.1,
		// 	position: [2.5, 0, -1],
		// 	scale: [2, 1, 1],
		// 	monsterPosition: [-6.5, 0, -2.2],
		// 	monsterInitialPosition: [-4.6, 0, -3.5],
		// 	monsterInitialRotation: [0, Math.PI / 2, 0],
		// 	animation: 'Idle',
		// 	trigger: {
		// 		objective: 1,
		// 		bathroomDoor: true,
		// 	},
		// }, // mirror 2 : gets closer when you look at it // 5 // door 38

		// spawn behind the player when he opens the window 'pssst' // 3
		// spawn behind the player when he opens the bathroom curtain 'pssst' // 4
		// spawn behind the player when he opens the tv stand 'pssst' // 5
	],
	[
		// RUNNING // 5
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [2.75, 0, -2],
			scale: [2, 0.5, 3],
			monsterPosition: [2, 0, 4],
			monsterInitialPosition: [1, 0, 4],
			animation: 'Idle',
		}, // running from the window to the door // 0 // door 36
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [2.75, 0, 0],
			scale: [2, 2, 3],
			monsterPosition: [2, 0, 4],
			monsterInitialPosition: [0.75, 0, 6.4],
			animation: 'Idle',
			trigger: {
				roomCurtain: true,
			},
		}, // running from the window curtain to the bed // 1 // door 37
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [1.75, 0, -0.5],
			scale: [5, 2, 3],
			monsterPosition: [-1.55, -0.45, -1.3],
			monsterInitialPosition: [-1.45, 0, -1.32],
			monsterInitialRotation: [0, Math.PI / 2, 0],
			animation: 'Stand',
			trigger: {
				nightStand: true,
			},
		}, // running from the nightstand to the hallway // 2 // door 38
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [2.8, 0, -0.7],
			scale: [3, 2, 3],
			monsterPosition: [-1, 2.5, -0.95],
			monsterInitialPosition: [-0.3, 2.4, -0.9],
			animation: 'CeilingCrawlIdle',
		},
		// running from the nightstand ceiling to the hallway // 3 // door 39
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [2, 0, 2.81],
			scale: [3, 2, 3],
			monsterPosition: [-1.3, 2.5, 2.8],
			monsterInitialPosition: [-1.3, 1.65, 2.8],
			animation: 'CeilingCrawlIdle',
		},
		// running from the other room ceiling corner to the second room entrance // 4 // door 40
		{
			probability: 0.1,
			deathReason: 'If you see the client, run away',
			position: [2.75, 0, -1.4],
			scale: [2.5, 2, 3],
			monsterPosition: [2, 2.5, 4],
			monsterInitialPosition: [1, 1.65, 4.5],
			animation: 'CeilingCrawlIdle',
		},
		// running from the window ceiling to the door // 5 // door 41
	],
];

export default levelData;
