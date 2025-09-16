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

const soundDecks = {
	deaths: {
		available: [],
		used: [],
	},
	jumpScares: {
		available: [],
		used: [],
	},
};

export const getWeightedRandomSound = (soundArray, historyKey) => {
	const deck = soundDecks[historyKey];

	if (deck.available.length === 0) {
		deck.available = [...deck.used];
		deck.used = [];
	}

	const randomIndex = Math.floor(Math.random() * deck.available.length);
	const selectedSound = deck.available[randomIndex];

	deck.available.splice(randomIndex, 1);
	deck.used.push(selectedSound);

	return selectedSound;
};

const BASE_SOUNDS = {
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
	menu: {
		mp3: '/sounds/menu.mp3',
		settings: 'effect',
		volume: 0.3,
	},
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
	monsterStep5: {
		mp3: '/sounds/monster_step5.mp3',
		settings: 'monster',
	},
	monsterStep6: {
		mp3: '/sounds/monster_step6.mp3',
		settings: 'monster',
	},
	monsterStep7: {
		mp3: '/sounds/monster_step7.mp3',
		settings: 'monster',
	},
	monsterStep8: {
		mp3: '/sounds/monster_step8.mp3',
		settings: 'monster',
	},
	monsterStep9: {
		mp3: '/sounds/monster_step9.mp3',
		settings: 'monster',
	},
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
	flashlight: {
		mp3: '/sounds/flashlight.mp3',
		settings: 'interaction',
	},
	punch: {
		mp3: '/sounds/punch.mp3',
		settings: 'damage',
	},
	jumpScare: {
		mp3: '/sounds/jump_scare.mp3',
		settings: 'special',
	},
	jumpScareAmbiance: {
		mp3: '/sounds/jump_scare_ambiance.mp3',
		settings: 'special',
	},
	knocking: {
		mp3: '/sounds/knocking.mp3',
		settings: 'special',
	},
};

export const SOUNDS = BASE_SOUNDS;

const audioInstances = {};
let soundsLoaded = false;

async function loadAudioFile(url) {
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch (error) {
		console.error(`Error loading audio file ${url}:`, error);
		return url;
	}
}

export async function preloadSounds(onSoundLoaded) {
	if (soundsLoaded) return Promise.resolve();

	const loadPromises = Object.entries(SOUNDS).map(async ([key, sound]) => {
		if (sound.mp3) {
			try {
				const blobUrl = await loadAudioFile(sound.mp3);
				const audio = new Audio();
				audio.src = blobUrl;
				audio.preload = 'auto';

				const settings =
					SOUND_SETTINGS[sound.settings] || SOUND_SETTINGS.default;
				audio.volume =
					sound.volume !== undefined ? sound.volume : settings.volume || 0.5;

				audioInstances[key] = audio;

				return new Promise((resolve) => {
					audio.addEventListener(
						'canplaythrough',
						() => {
							if (typeof onSoundLoaded === 'function') {
								onSoundLoaded(key);
							}
							resolve();
						},
						{ once: true }
					);
					audio.load();
				});
			} catch (error) {
				console.error(`Failed to load sound ${key}:`, error);
				return Promise.resolve();
			}
		}
		return Promise.resolve();
	});

	try {
		const keyBlobUrl = await loadAudioFile('/sounds/key.mp3');
		audioInstances.keyPool = Array(5)
			.fill(null)
			.map(() => {
				const audio = new Audio(keyBlobUrl);
				audio.volume = 0.25;
				audio.preload = 'auto';
				if (typeof onSoundLoaded === 'function') {
					audio.addEventListener(
						'canplaythrough',
						() => {
							onSoundLoaded('keyPool');
						},
						{ once: true }
					);
				}
				return audio;
			});
	} catch (error) {
		console.error('Failed to load key sound:', error);
	}

	await Promise.all(loadPromises);
	soundsLoaded = true;
}

export function areSoundsLoaded() {
	return soundsLoaded;
}

export function getAudioInstance(key) {
	if (!soundsLoaded) {
		console.warn(
			'Attempted to get audio instance before sounds were loaded: ' + key
		);
		return null;
	}

	const instance = audioInstances[key];
	if (!instance) {
		console.warn(`No audio instance found for key: ${key}`);
		return null;
	}

	if (!instance.paused) {
		try {
			const newInstance = new Audio(instance.src);
			newInstance.volume = instance.volume;
			return newInstance;
		} catch (error) {
			console.error(`Error creating new audio instance for ${key}:`, error);
			return null;
		}
	}

	instance.currentTime = 0;
	return instance;
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

	const settings = SOUND_SETTINGS[sound.settings] || SOUND_SETTINGS.default;

	return {
		url: sound.mp3,
		loop: false,
		distance: settings.distance || 0.4,
		refDistance: settings.refDistance || 1,
		rolloffFactor: settings.rolloffFactor || 1,
		volume: settings.volume || 0.5,
	};
};
