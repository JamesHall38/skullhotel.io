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
let loadingAttempts = 0;
const MAX_LOADING_ATTEMPTS = 3;
let autoLoadTimeoutActive = false;

// Détection pour iOS
const isIOS = () => {
	return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

async function loadAudioFile(url) {
	try {
		if (isIOS()) {
			return url;
		}

		const response = await fetch(url);
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch (error) {
		console.error(`Error loading audio file ${url}:`, error);
		return url;
	}
}

export async function preloadSounds() {
	if (soundsLoaded) return Promise.resolve();

	if (loadingAttempts >= MAX_LOADING_ATTEMPTS) {
		console.warn(
			'Maximum loading attempts reached. Setting sounds as loaded anyway.'
		);
		soundsLoaded = true;
		return Promise.resolve();
	}

	loadingAttempts++;

	if (isIOS()) {
		try {
			Object.entries(SOUNDS).forEach(([key, sound]) => {
				if (sound.mp3) {
					const audio = new Audio();
					audio.src = sound.mp3;
					audio.preload = 'auto';

					const settings =
						SOUND_SETTINGS[sound.settings] || SOUND_SETTINGS.default;
					audio.volume = Math.min(settings.volume || 0.5, 0.8);

					audioInstances[key] = audio;
				}
			});

			const keySound = new Audio('/sounds/key.mp3');
			keySound.volume = 0.25;
			keySound.preload = 'auto';
			audioInstances.keyPool = Array(5)
				.fill(null)
				.map(() => {
					const audio = new Audio('/sounds/key.mp3');
					audio.volume = 0.25;
					audio.preload = 'auto';
					return audio;
				});

			const unlockAudio = async () => {
				const tempAudio = new Audio();
				tempAudio
					.play()
					.then(() => tempAudio.pause())
					.catch((e) => console.warn('Audio unlock failed:', e));
			};

			await unlockAudio();
			soundsLoaded = true;
			return Promise.resolve();
		} catch (error) {
			console.error('iOS audio preloading error:', error);
			soundsLoaded = true;
			return Promise.resolve();
		}
	}

	const loadPromises = Object.entries(SOUNDS).map(async ([key, sound]) => {
		if (sound.mp3) {
			try {
				const blobUrl = await loadAudioFile(sound.mp3);
				const audio = new Audio();
				audio.src = blobUrl;
				audio.preload = 'auto';

				// Set volume based on settings
				const settings =
					SOUND_SETTINGS[sound.settings] || SOUND_SETTINGS.default;
				audio.volume = settings.volume || 0.5;

				audioInstances[key] = audio;

				return new Promise((resolve) => {
					audio.addEventListener('canplaythrough', resolve, { once: true });
					const timeout = setTimeout(resolve, 3000);
					audio.addEventListener(
						'canplaythrough',
						() => {
							clearTimeout(timeout);
							resolve();
						},
						{ once: true }
					);

					audio.addEventListener(
						'error',
						(e) => {
							console.warn(`Audio loading error for ${key}:`, e);
							clearTimeout(timeout);
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
				return audio;
			});
	} catch (error) {
		console.error('Failed to load key sound:', error);
	}

	try {
		await Promise.all(loadPromises);
		soundsLoaded = true;
	} catch (error) {
		console.error('Error loading sounds:', error);
		soundsLoaded = true;
	}
}

export function areSoundsLoaded() {
	if (!soundsLoaded && !autoLoadTimeoutActive) {
		autoLoadTimeoutActive = true;

		setTimeout(() => {
			if (!soundsLoaded) {
				console.warn('Forcing sounds to be considered as loaded after timeout');
				soundsLoaded = true;
			}
		}, 5000);
	}

	return soundsLoaded;
}

export function getAudioInstance(key) {
	if (!soundsLoaded) {
		console.warn(
			'Attempted to get audio instance before sounds were loaded: ' + key
		);
		return createDummyAudio();
	}

	const instance = audioInstances[key];
	if (!instance) {
		console.warn(`No audio instance found for key: ${key}`);
		return createDummyAudio();
	}

	if (!instance.paused) {
		try {
			const newInstance = new Audio(instance.src);
			newInstance.volume = instance.volume;
			return newInstance;
		} catch (error) {
			console.error(`Error creating new audio instance for ${key}:`, error);
			return createDummyAudio();
		}
	}

	try {
		instance.currentTime = 0;
		return instance;
	} catch (error) {
		console.warn(`Error resetting audio time for ${key}:`, error);
		return createDummyAudio();
	}
}

function createDummyAudio() {
	return {
		play: () => Promise.resolve(),
		pause: () => {},
		currentTime: 0,
		volume: 0,
		paused: true,
	};
}

export function getKeyAudioPool() {
	if (!audioInstances.keyPool) {
		console.warn('Key audio pool not loaded, returning dummy audio objects');
		return Array(5)
			.fill()
			.map(() => createDummyAudio());
	}
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
		distance: settings.distance || 1,
		refDistance: settings.refDistance || 1,
		rolloffFactor: settings.rolloffFactor || 1,
		volume: settings.volume || 0.5,
	};
};

export const unlockAudio = async () => {
	try {
		const audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();
		if (audioContext.state === 'suspended') {
			await audioContext.resume();
		}

		const silentBuffer = audioContext.createBuffer(1, 1, 22050);
		const source = audioContext.createBufferSource();
		source.buffer = silentBuffer;
		source.connect(audioContext.destination);
		source.start(0);

		const audio = new Audio();
		audio.volume = 0;

		try {
			await audio.play();
			setTimeout(() => audio.pause(), 1);
		} catch (e) {
			console.warn('Silent audio play failed:', e);
		}

		if (isIOS()) {
			Object.entries(audioInstances).forEach(([_, audio]) => {
				if (audio && typeof audio.play === 'function') {
					try {
						const originalVolume = audio.volume;
						audio.volume = 0.01;
						audio
							.play()
							.then(() => {
								audio.pause();
								audio.currentTime = 0;
								audio.volume = originalVolume;
							})
							.catch(() => {
								audio.volume = originalVolume;
							});
					} catch (e) {
						console.warn('Audio unlock failed:', e);
					}
				}
			});
		}

		return true;
	} catch (e) {
		console.warn('Audio unlock failed:', e);
		return false;
	}
};

export function forceAudioPreload() {
	if (soundsLoaded) return;

	soundsLoaded = true;

	setTimeout(() => {
		preloadSounds().catch((error) => {
			console.warn('Background audio preload failed:', error);
		});
	}, 0);

	unlockAudio().catch((error) => {
		console.warn('Audio unlock failed:', error);
	});
}
