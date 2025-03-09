import { useRef, useEffect } from 'react';
import useHiding from '../hooks/useHiding';
import useGame from '../hooks/useGame';
import { getAudioInstance, areSoundsLoaded } from '../utils/audio';

export default function KnockingSound() {
	const knockingSoundRef = useRef(null);
	const isMonsterKnocking = useHiding((state) => state.isMonsterKnocking);
	const knockingRoom = useHiding((state) => state.knockingRoom);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const silentKnocking = useHiding((state) => state.silentKnocking);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				knockingSoundRef.current = getAudioInstance('knocking');
				if (knockingSoundRef.current) {
					knockingSoundRef.current.loop = false;
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (knockingSoundRef.current) {
				knockingSoundRef.current.pause();
				knockingSoundRef.current.currentTime = 0;
			}
		};
	}, []);

	useEffect(() => {
		if (
			isMonsterKnocking &&
			knockingRoom === playerPositionRoom &&
			!silentKnocking
		) {
			if (knockingSoundRef.current) {
				knockingSoundRef.current.currentTime = 0;
				knockingSoundRef.current.play().catch(() => {});
			}
		} else {
			if (knockingSoundRef.current) {
				knockingSoundRef.current.pause();
				knockingSoundRef.current.currentTime = 0;
			}
		}
	}, [isMonsterKnocking, knockingRoom, playerPositionRoom, silentKnocking]);

	return null;
}
