import { useRef, useMemo, useEffect, useState } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';
import useSettings from '../hooks/useSettings';
import KnockingSound from './KnockingSound';
import {
	getAudioInstance,
	areSoundsLoaded,
	getMasterVolume,
} from '../utils/audio';
import useGameplaySettings from '../hooks/useGameplaySettings';

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);
	const end = useGame((state) => state.end);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isListening = useGame((state) => state.isListening);
	const endAnimationPlaying = useGame((state) => state.endAnimationPlaying);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const masterVolume = useSettings((state) => state.masterVolume);

	const [soundsReady, setSoundsReady] = useState(false);
	const ambiant1Ref = useRef(null);
	const boomRef = useRef(null);
	const ambiant2Ref = useRef(null);
	const tenseRef = useRef(null);

	const baseVolumes = useRef({
		ambiant1: 0.7,
		boom: 1,
		ambiant2: 0.4,
		tense: 0.4,
	});

	useEffect(() => {
		if (!soundsReady) return;

		if (endAnimationPlaying) {
			[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
				if (ref.current) {
					ref.current.pause();
					ref.current.currentTime = 0;
				}
			});
		}
	}, [endAnimationPlaying, soundsReady]);

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				ambiant1Ref.current = getAudioInstance('ambiant1');
				boomRef.current = getAudioInstance('boom');
				ambiant2Ref.current = getAudioInstance('ambiant2');
				tenseRef.current = getAudioInstance('tense');

				if (
					ambiant1Ref.current &&
					boomRef.current &&
					ambiant2Ref.current &&
					tenseRef.current
				) {
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();
	}, []);

	useEffect(() => {
		if (!soundsReady) return;

		const setupAudio = (audioRef, volume, loop = true) => {
			if (!audioRef.current) return;
			audioRef.current.volume = volume * getMasterVolume();
			audioRef.current.loop = loop;
			if (audioRef === boomRef) {
				audioRef.current.playbackRate = 0.9;
			}
		};

		setupAudio(ambiant1Ref, baseVolumes.current.ambiant1);
		setupAudio(boomRef, baseVolumes.current.boom);
		setupAudio(ambiant2Ref, baseVolumes.current.ambiant2);
		setupAudio(tenseRef, baseVolumes.current.tense);

		return () => {
			[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
				if (ref.current) {
					ref.current.pause();
					ref.current.currentTime = 0;
				}
			});
		};
	}, [soundsReady]);

	useEffect(() => {
		if (!soundsReady) return;

		[
			{ ref: ambiant1Ref, volume: baseVolumes.current.ambiant1 },
			{ ref: boomRef, volume: baseVolumes.current.boom },
			{ ref: ambiant2Ref, volume: baseVolumes.current.ambiant2 },
			{ ref: tenseRef, volume: baseVolumes.current.tense },
		].forEach(({ ref, volume }) => {
			if (ref.current && !isListening) {
				ref.current.volume = volume * masterVolume;
			}
		});
	}, [masterVolume, soundsReady, isListening]);

	useEffect(() => {
		if (!soundsReady) return;

		const totalSteps = 4;
		const currentStep = Math.floor(
			(doneObjectives / (roomCount / 2)) * totalSteps
		);

		if (currentStep >= 3) {
			tenseRef.current?.play().catch(() => {});
		} else if (currentStep >= 2) {
			ambiant2Ref.current?.play().catch(() => {});
		} else if (currentStep >= 1) {
			boomRef.current?.play().catch(() => {});
		} else if (doneObjectives > 0) {
			ambiant1Ref.current?.play().catch(() => {});
		}
	}, [objectives, doneObjectives, roomCount, soundsReady]);

	useEffect(() => {
		if (!soundsReady) return;

		if (end || openDeathScreen) {
			[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
				if (ref.current) {
					ref.current.pause();
					ref.current.currentTime = 0;
				}
			});
		}
	}, [end, openDeathScreen, soundsReady]);

	useEffect(() => {
		if (!soundsReady) return;

		let fadeInterval;

		if (isListening) {
			fadeInterval = setInterval(() => {
				[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
					if (ref.current && ref.current.volume > 0.1 * masterVolume) {
						ref.current.volume = Math.max(
							0.1 * masterVolume,
							ref.current.volume - 0.1 * masterVolume
						);
					}
				});
			}, 100);
		} else {
			if (ambiant1Ref.current)
				ambiant1Ref.current.volume =
					baseVolumes.current.ambiant1 * masterVolume;
			if (boomRef.current)
				boomRef.current.volume = baseVolumes.current.boom * masterVolume;
			if (ambiant2Ref.current)
				ambiant2Ref.current.volume =
					baseVolumes.current.ambiant2 * masterVolume;
			if (tenseRef.current)
				tenseRef.current.volume = baseVolumes.current.tense * masterVolume;
		}

		return () => {
			if (fadeInterval) clearInterval(fadeInterval);
		};
	}, [isListening, soundsReady, masterVolume]);

	return <KnockingSound />;
};

export default Sound;
