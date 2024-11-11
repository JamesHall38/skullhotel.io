import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';

const STEP_DISTANCE = 0.8;
const floor = -0.2;

export default function FootSteps({ playerPosition }) {
	const loading = useGame((state) => state.loading);
	const footstepSounds = [
		useRef(new Audio('/sounds/step1.ogg')),
		useRef(new Audio('/sounds/step2.ogg')),
		useRef(new Audio('/sounds/step3.ogg')),
		useRef(new Audio('/sounds/step4.ogg')),
		useRef(new Audio('/sounds/step5.ogg')),
		useRef(new Audio('/sounds/step6.ogg')),
		useRef(new Audio('/sounds/step7.ogg')),
		useRef(new Audio('/sounds/step8.ogg')),
		useRef(new Audio('/sounds/step9.ogg')),
	];

	const footstepIndexRef = useRef(0);
	const lastStepPosition = useRef(new THREE.Vector3());

	useFrame(() => {
		if (playerPosition.current.y <= floor && !loading) {
			const distanceTraveled = lastStepPosition.current.distanceTo(
				playerPosition.current
			);

			if (distanceTraveled > STEP_DISTANCE) {
				const sound = footstepSounds[footstepIndexRef.current].current;
				sound.volume = 0.8;
				sound.currentTime = 0;
				sound.play();

				footstepIndexRef.current =
					(footstepIndexRef.current + 1) % footstepSounds.length;

				lastStepPosition.current.copy(playerPosition.current);
			}
		}
	});
}
