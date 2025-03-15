export const SOUND_SETTINGS = {
	default: {
		distance: 1,
		refDistance: 1,
		rolloffFactor: 1,
		volume: 0.5,
	},
	ambient: {
		distance: 3,
		refDistance: 1,
		rolloffFactor: 3,
		volume: 1,
	},
	effect: {
		distance: 0.75,
		refDistance: 1,
		rolloffFactor: 1,
		volume: 1,
	},
};

export const SOUNDS = {
	ambiant1: {
		mp3: '/sounds/ambiant1.mp3',
		settings: 'ambient',
	},
	ambiant2: {
		mp3: '/sounds/ambiant2.mp3',
		settings: 'ambient',
	},
	boom: {
		mp3: '/sounds/boom.mp3',
		settings: 'ambient',
	},
	boomAmbient: {
		mp3: '/sounds/boom.mp3',
		settings: 'ambient',
	},
	tense: {
		mp3: '/sounds/tense.mp3',
		settings: 'ambient',
	},
	breathing: {
		mp3: '/sounds/breathing.mp3',
		settings: 'ambient',
	},
	whiteNoise: {
		mp3: '/sounds/white_noise.mp3',
		settings: 'ambient',
	},
	radio: {
		mp3: '/sounds/radio.mp3',
		settings: 'ambient',
	},
	hide: {
		mp3: '/sounds/hide.mp3',
		settings: 'ambient',
	},
	// Sons de pas
	step1: {
		mp3: '/sounds/step1.mp3',
		settings: 'steps',
	},
	step2: {
		mp3: '/sounds/step2.mp3',
		settings: 'steps',
	},
	step3: {
		mp3: '/sounds/step3.mp3',
		settings: 'steps',
	},
	step4: {
		mp3: '/sounds/step4.mp3',
		settings: 'steps',
	},
	step5: {
		mp3: '/sounds/step5.mp3',
		settings: 'steps',
	},
	step6: {
		mp3: '/sounds/step6.mp3',
		settings: 'steps',
	},
	step7: {
		mp3: '/sounds/step7.mp3',
		settings: 'steps',
	},
	step8: {
		mp3: '/sounds/step8.mp3',
		settings: 'steps',
	},
	step9: {
		mp3: '/sounds/step9.mp3',
		settings: 'steps',
	},
	// Sons du monstre
	monsterStep1: {
		mp3: '/sounds/monster_step1.mp3',
		settings: 'monster',
	},
	monsterStep2: {
		mp3: '/sounds/monster_step2.mp3',
		settings: 'monster',
	},
	monsterStep3: {
		mp3: '/sounds/monster_step3.mp3',
		settings: 'monster',
	},
	monsterStep4: {
		mp3: '/sounds/monster_step4.mp3',
		settings: 'monster',
	},
	// Sons d'interaction
	doorOpen: {
		mp3: '/sounds/open.mp3',
		settings: 'interaction',
	},
	doorClose: {
		mp3: '/sounds/close.mp3',
		settings: 'interaction',
	},
	closetOpen: {
		mp3: '/sounds/closet_open.mp3',
		settings: 'interaction',
	},
	closetClose: {
		mp3: '/sounds/closet_close.mp3',
		settings: 'interaction',
	},
	window: {
		mp3: '/sounds/window.mp3',
		settings: 'interaction',
	},
	curtain: {
		mp3: '/sounds/curtain.mp3',
		settings: 'interaction',
	},
	bottles: {
		mp3: '/sounds/bottles.mp3',
		settings: 'interaction',
	},
	bedsheets: {
		mp3: '/sounds/bedsheets.mp3',
		settings: 'interaction',
	},
	bed: {
		mp3: '/sounds/bed.mp3',
		settings: 'interaction',
	},
	switchOn: {
		mp3: '/sounds/switch_on.mp3',
		settings: 'interaction',
	},
	switchOff: {
		mp3: '/sounds/switch_off.mp3',
		settings: 'interaction',
	},
	bulb: {
		mp3: '/sounds/bulb.mp3',
		settings: 'interaction',
	},
	neon: {
		mp3: '/sounds/neon.mp3',
		settings: 'interaction',
	},
	beep: {
		mp3: '/sounds/beep.mp3',
		settings: 'interaction',
	},
	flashlight: {
		mp3: '/sounds/flashlight.mp3',
		settings: 'interaction',
	},
	// Sons de dégâts
	hurt1: {
		mp3: '/sounds/hurt1.mp3',
		settings: 'damage',
	},
	hurt2: {
		mp3: '/sounds/hurt2.mp3',
		settings: 'damage',
	},
	hurt3: {
		mp3: '/sounds/hurt3.mp3',
		settings: 'damage',
	},
	hurt4: {
		mp3: '/sounds/hurt4.mp3',
		settings: 'damage',
	},
	impact: {
		mp3: '/sounds/impact.mp3',
		settings: 'damage',
	},
	punch: {
		mp3: '/sounds/punch.mp3',
		settings: 'damage',
	},
	// Sons spéciaux
	jumpScare: {
		mp3: '/sounds/jump_scare.mp3',
		settings: 'special',
	},
	jumpScareAmbiance: {
		mp3: '/sounds/jump_scare_ambiance.mp3',
		settings: 'special',
	},
	scratching: {
		mp3: '/sounds/scratching.mp3',
		settings: 'special',
	},
	knocking: {
		mp3: '/sounds/knocking.mp3',
		settings: 'special',
	},
};

const audioInstances = {};
let soundsLoaded = false;

export function preloadSounds() {
	if (soundsLoaded) return Promise.resolve();

	Object.entries(SOUNDS).forEach(([key, sound]) => {
		if (sound.mp3) {
			const audio = new Audio(sound.mp3);
			audio.preload = 'auto';
			audioInstances[key] = audio;
		}
	});

	audioInstances.keyPool = Array(5)
		.fill(null)
		.map(() => {
			const audio = new Audio('/sounds/key.mp3');
			audio.volume = 0.25;
			return audio;
		});

	return Promise.all(
		Object.values(audioInstances)
			.flat()
			.map(
				(audio) =>
					new Promise((resolve) => {
						audio.addEventListener('loadedmetadata', resolve, { once: true });
						audio.load();
					})
			)
	).then(() => {
		soundsLoaded = true;
	});
}

export function areSoundsLoaded() {
	return soundsLoaded;
}

export function getAudioInstance(key) {
	return audioInstances[key];
}

export function getKeyAudioPool() {
	return audioInstances.keyPool;
}

export const getSoundUrl = (soundName) => {
	const sound = SOUNDS[soundName];
	if (!sound) {
		console.warn(`Sound ${soundName} not found`);
		return null;
	}

	return sound.mp3 || null;
};

export const usePositionalSound = (soundName) => {
	const sound = SOUNDS[soundName];
	if (!sound) {
		console.warn(`Sound ${soundName} not found`);
		return {};
	}

	return {
		url: sound.mp3,
		loop: false,
		distance: 1,
		refDistance: 1,
		rolloffFactor: 1,
		volume: 0.5,
	};
};
