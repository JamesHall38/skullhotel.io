import { useRef, useMemo, useEffect } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';
import KnockingSound from './KnockingSound';

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);
	const end = useGame((state) => state.end);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isListening = useGame((state) => state.isListening);
	// const roomNumber = useGame((state) => state.roomNumber);
	const roomNumber = 20;

	const ambiant1Ref = useRef(new Audio('/sounds/ambiant1.mp3'));
	const boomRef = useRef(new Audio('/sounds/boom.mp3'));
	const ambiant2Ref = useRef(new Audio('/sounds/ambiant2.mp3'));
	const tenseRef = useRef(new Audio('/sounds/tense.mp3'));

	const defaultVolumes = useRef({
		ambiant1: 0.7,
		boom: 1,
		ambiant2: 0.4,
		tense: 0.4,
	});

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	useEffect(() => {
		const setupAudio = (audioRef, volume, loop = true) => {
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
				ref.current.pause();
				ref.current.currentTime = 0;
			});
		};
	}, []);

	useEffect(() => {
		if (doneObjectives > roomNumber / 2 - 2) {
			tenseRef.current.play().catch(() => {});
		} else if (doneObjectives > roomNumber / 3 - 1) {
			ambiant2Ref.current.play().catch(() => {});
		} else if (doneObjectives > roomNumber / 6 - 1) {
			boomRef.current.play().catch(() => {});
		} else if (doneObjectives > 0) {
			ambiant1Ref.current.play().catch(() => {});
		}
	}, [objectives, doneObjectives, roomNumber]);

	useEffect(() => {
		if (end || openDeathScreen) {
			[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
				ref.current.pause();
				ref.current.currentTime = 0;
			});
		}
	}, [end, openDeathScreen]);

	useEffect(() => {
		let fadeInterval;

		if (isListening) {
			// Fade out
			fadeInterval = setInterval(() => {
				[ambiant1Ref, boomRef, ambiant2Ref, tenseRef].forEach((ref) => {
					if (ref.current.volume > 0.1) {
						ref.current.volume = Math.max(0.1, ref.current.volume - 0.1);
					}
				});
			}, 100);
		} else {
			// Restore original volumes
			ambiant1Ref.current.volume = defaultVolumes.current.ambiant1;
			boomRef.current.volume = defaultVolumes.current.boom;
			ambiant2Ref.current.volume = defaultVolumes.current.ambiant2;
			tenseRef.current.volume = defaultVolumes.current.tense;
		}

		return () => {
			if (fadeInterval) clearInterval(fadeInterval);
		};
	}, [isListening]);

	return <KnockingSound />;
};

export default Sound;
