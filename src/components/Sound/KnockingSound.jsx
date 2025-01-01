import { useRef, useEffect } from 'react';
import { PositionalAudio } from '@react-three/drei';
import useHiding from '../../hooks/useHiding';
import useGame from '../../hooks/useGame';

export default function KnockingSound() {
	const knockingSoundRef = useRef();
	const isMonsterKnocking = useHiding((state) => state.isMonsterKnocking);
	const knockingRoom = useHiding((state) => state.knockingRoom);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);

	useEffect(() => {
		if (isMonsterKnocking && knockingRoom === playerPositionRoom) {
			if (knockingSoundRef.current) {
				console.log('play');
				knockingSoundRef.current.play();
			}
		} else {
			if (knockingSoundRef.current) {
				knockingSoundRef.current.stop();
			}
		}
	}, [isMonsterKnocking, knockingRoom, playerPositionRoom]);

	return (
		<PositionalAudio
			ref={knockingSoundRef}
			url="/sounds/knocking.ogg"
			loop={true}
			distance={200}
			refDistance={100}
			rolloffFactor={0.1}
			volume={20}
		/>
	);
}
