import { useRef } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { usePositionalSound } from '../utils/audio';

export default function KnockingSound() {
	const knockingSound = usePositionalSound('knocking');
	const knockingSoundRef = useRef();

	return (
		<PositionalAudio ref={knockingSoundRef} {...knockingSound} loop={false} />
	);
}
