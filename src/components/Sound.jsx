import { useEffect, useRef, useMemo } from 'react';
import useInterface from '../hooks/useInterface';
import { roomNumber } from '../utils/config';

const Sound = () => {
	const objectives = useInterface((state) => state.interfaceObjectives);

	const ambiant1Ref = useRef(new Audio('/sounds/ambiant1.ogg'));
	const boomRef = useRef(new Audio('/sounds/boom.ogg'));
	const ambiant2Ref = useRef(new Audio('/sounds/ambiant2.ogg'));
	const tenseRef = useRef(new Audio('/sounds/tense.ogg'));

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
		setupAudio(boomRef, 0.6);
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

	return null;
};

export default Sound;