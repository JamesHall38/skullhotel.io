import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import { useFrame, useThree } from '@react-three/fiber';

const FLICKER_DURATION = 10000; // 10 seconds
const DEFAULT_INTENSITY = 6;

export default function Flashlight({ playerRef, isCrouching }) {
	const isFlickering = useGame((state) => state.isFlickering);
	const spotLightRef = useRef();
	const { scene, camera } = useThree();
	const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);

	useEffect(() => {
		spotLightRef.current.angle = Math.PI / 6;
		spotLightRef.current.penumbra = 0.7;
		spotLightRef.current.distance = 15;
		spotLightRef.current.decay = 2;
		spotLightRef.current.color = new THREE.Color('#fff5e6');
	}, [camera]);

	useEffect(() => {
		const targetObject = new THREE.Object3D();
		scene.add(targetObject);
		spotLightRef.current.target = targetObject;

		return () => {
			scene.remove(targetObject);
		};
	}, [scene]);

	const flickerLight = useCallback(() => {
		let flickerInterval = setInterval(() => {
			setIntensity(Math.random() * DEFAULT_INTENSITY);
		}, 50);

		setTimeout(() => {
			clearInterval(flickerInterval);
			setIntensity(0);

			setTimeout(() => {
				flickerInterval = setInterval(() => {
					setIntensity(Math.random() * DEFAULT_INTENSITY);
				}, 50);

				setTimeout(() => {
					clearInterval(flickerInterval);
					setIntensity(DEFAULT_INTENSITY);
				}, 1000);
			}, FLICKER_DURATION);
		}, 1000);
	}, []);

	useEffect(() => {
		if (isFlickering) {
			flickerLight();
		}
	}, [isFlickering, flickerLight]);

	useFrame((state) => {
		if (!playerRef.current) return;

		const position = playerRef.current;
		const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			state.camera.quaternion
		);
		const distance = 10;
		const backwardDistance = 0.4;

		const lightHeight = isCrouching ? 0.8 : 1.75;

		const lightPosition = new THREE.Vector3(
			position.x - cameraDirection.x * backwardDistance,
			position.y + lightHeight,
			position.z - cameraDirection.z * backwardDistance
		);

		spotLightRef.current.position.set(
			lightPosition.x,
			lightPosition.y,
			lightPosition.z
		);

		const targetPosition = new THREE.Vector3(
			position.x + cameraDirection.x * distance,
			position.y + cameraDirection.y * distance + 2,
			position.z + cameraDirection.z * distance
		);
		spotLightRef.current.target.position.copy(targetPosition);
	});

	return (
		<spotLight
			shadow-normalBias={0.04}
			intensity={intensity}
			castShadow
			ref={spotLightRef}
			power={20}
		/>
	);
}
