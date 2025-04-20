import { useRef, useMemo, useEffect, useState } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';
import KnockingSound from './KnockingSound';
import { getAudioInstance, areSoundsLoaded } from '../utils/audio';
import useGameplaySettings from '../hooks/useGameplaySettings';

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);
	const end = useGame((state) => state.end);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isListening = useGame((state) => state.isListening);
	const endAnimationPlaying = useGame((state) => state.endAnimationPlaying);
	const roomCount = useGameplaySettings((state) => state.roomCount);

	const [soundsReady, setSoundsReady] = useState(false);
	const ambiant1Ref = useRef(null);
	const boomRef = useRef(null);
	const ambiant2Ref = useRef(null);
	const tenseRef = useRef(null);

	const defaultVolumes = useRef({
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
			audioRef.current.volume = volume;
			audioRef.current.loop = loop;
			if (audioRef === boomRef) {
				audioRef.current.playbackRate = 0.9;
			}
		};

		setupAudio(ambiant1Ref, defaultVolumes.current.ambiant1);
		setupAudio(boomRef, defaultVolumes.current.boom);
		setupAudio(ambiant2Ref, defaultVolumes.current.ambiant2);
		setupAudio(tenseRef, defaultVolumes.current.tense);

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
					if (ref.current && ref.current.volume > 0.1) {
						ref.current.volume = Math.max(0.1, ref.current.volume - 0.1);
					}
				});
			}, 100);
		} else {
			if (ambiant1Ref.current)
				ambiant1Ref.current.volume = defaultVolumes.current.ambiant1;
			if (boomRef.current) boomRef.current.volume = defaultVolumes.current.boom;
			if (ambiant2Ref.current)
				ambiant2Ref.current.volume = defaultVolumes.current.ambiant2;
			if (tenseRef.current)
				tenseRef.current.volume = defaultVolumes.current.tense;
		}

		return () => {
			if (fadeInterval) clearInterval(fadeInterval);
		};
	}, [isListening, soundsReady]);

	return <KnockingSound />;
};

export default Sound;
