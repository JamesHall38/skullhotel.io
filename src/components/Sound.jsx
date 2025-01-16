import { useRef, useMemo, useEffect } from 'react';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';
import { PositionalAudio } from '@react-three/drei';
import { usePositionalSound } from '../utils/audio';
import KnockingSound from './KnockingSound';

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);
	const end = useGame((state) => state.end);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const isListening = useGame((state) => state.isListening);
	const roomNumber = useGame((state) => state.roomNumber);

	const ambiant1Sound = usePositionalSound('ambiant1');
	const boomSound = usePositionalSound('boom');
	const ambiant2Sound = usePositionalSound('ambiant2');
	const tenseSound = usePositionalSound('tense');

	const ambiant1Ref = useRef();
	const boomRef = useRef();
	const ambiant2Ref = useRef();
	const tenseRef = useRef();

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
	}, [objectives, doneObjectives, roomNumber]);

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

	return (
		<>
			<PositionalAudio ref={ambiant1Ref} {...ambiant1Sound} loop={true} />
			<PositionalAudio ref={boomRef} {...boomSound} loop={true} />
			<PositionalAudio ref={ambiant2Ref} {...ambiant2Sound} loop={true} />
			<PositionalAudio ref={tenseRef} {...tenseSound} loop={true} />
			<KnockingSound />
		</>
	);
};

export default Sound;
