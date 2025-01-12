import { useEffect, useRef, useMemo } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';
import { roomNumber } from '../utils/config';
<<<<<<< Updated upstream
=======
import KnockingSound from './KnockingSound';
>>>>>>> Stashed changes

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);
	const end = useGame((state) => state.end);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isListening = useGame((state) => state.isListening);

	const ambiant1Ref = useRef(new Audio('/sounds/ambiant1.ogg'));
	const boomRef = useRef(new Audio('/sounds/boom.ogg'));
	const ambiant2Ref = useRef(new Audio('/sounds/ambiant2.ogg'));
	const tenseRef = useRef(new Audio('/sounds/tense.ogg'));

	const defaultVolumes = useRef({
		ambiant1: 0.7,
		boom: 0.9,
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
		};

		setupAudio(ambiant1Ref, 0.7);
		setupAudio(boomRef, 0.9);
		setupAudio(ambiant2Ref, 0.4);
		setupAudio(tenseRef, 0.4);
	}, []);

	useEffect(() => {
		if (doneObjectives > roomNumber / 2 - 2) {
			tenseRef.current.play();
		} else if (doneObjectives > roomNumber / 3 - 1) {
			ambiant2Ref.current.play();
		} else if (doneObjectives > roomNumber / 6 - 1) {
			boomRef.current.play();
		} else if (doneObjectives > 0) {
			ambiant1Ref.current.play();
		}
	}, [objectives, doneObjectives]);

	useEffect(() => {
		const resetAudio = (audioRef) => {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		};

		if (end) {
			resetAudio(ambiant1Ref);
			resetAudio(boomRef);
			resetAudio(ambiant2Ref);
			resetAudio(tenseRef);
		}
	}, [end]);

	useEffect(() => {
		if (openDeathScreen) {
			ambiant1Ref.current.pause();
			ambiant1Ref.current.currentTime = 0;
			ambiant2Ref.current.pause();
			ambiant2Ref.current.currentTime = 0;
			boomRef.current.pause();
			boomRef.current.currentTime = 0;
			tenseRef.current.pause();
			tenseRef.current.currentTime = 0;
		}
	}, [openDeathScreen]);

<<<<<<< Updated upstream
	return null;
=======
	useEffect(() => {
		let fadeInterval;

		if (isListening) {
			// Fade out
			fadeInterval = setInterval(() => {
				const refs = [ambiant1Ref, boomRef, ambiant2Ref, tenseRef];

				refs.forEach((ref) => {
					if (ref.current.volume > 0) {
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
>>>>>>> Stashed changes
};

export default Sound;
