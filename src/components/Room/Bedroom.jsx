import { useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import DetectionZone from '../DetectionZone';

const PROBABILITY_OF_DARKNESS = 20;

export default function Bedroom() {
	const { scene } = useGLTF('/models/room/bedroom.glb');
	const bakedTexture = useTexture('/textures/bedroom/baked_bedroom.webp');
	const bumpMap = useTexture('/textures/bedroom/bump_bedroom.webp');
	const roughnessMap = useTexture('/textures/bedroom/roughness_bedroom.webp');
	const lightMap = useTexture('/textures/bedroom/light_bedroom.webp');

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const materialRef = useRef();
	const lightSoundRef = useRef();

	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_DARKNESS)
	);

	bakedTexture.flipY = false;
	bumpMap.flipY = false;
	roughnessMap.flipY = false;
	lightMap.flipY = false;

	bakedTexture.colorSpace = THREE.SRGBColorSpace;
	lightMap.colorSpace = THREE.SRGBColorSpace;

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_DARKNESS),
		[]
	);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
		setIsDark(false);
	}, [deaths, generateRandomRoomNumber]);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber) {
			setIsDetectionActive(true);
		} else {
			setIsDetectionActive(false);
		}
	}, [playerPositionRoom, randomRoomNumber]);

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
					bumpMap,
					roughnessMap,
					lightMap,
					bumpScale: 8,
					lightMapIntensity: 1.0,
				});

				materialRef.current = material;

				child.castShadow = true;
				child.receiveShadow = true;
				child.material = material;
				child.material.needsUpdate = true;
			}
		});
	}, [scene, bakedTexture, bumpMap, roughnessMap, lightMap]);

	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.lightMapIntensity = isDark ? 0 : 1.0;
			materialRef.current.needsUpdate = true;
		}
	}, [isDark]);

	useEffect(() => {
		if (isDark && lightSoundRef.current) {
			lightSoundRef.current.play();
		}
	}, [isDark]);

	return (
		<>
			{isDetectionActive && (
				<DetectionZone
					position={[2, 0, 0]}
					scale={[2, 2, 2]}
					onDetect={() => {
						setIsDark(true);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<primitive object={scene} />
			<PositionalAudio
				ref={lightSoundRef}
				url="/sounds/bulb.ogg"
				distance={1}
				loop={false}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</>
	);
}

useGLTF.preload('/models/room/bedroom.glb');
useTexture.preload('/textures/bedroom/baked_bedroom.webp');
useTexture.preload('/textures/bedroom/bump_bedroom.webp');
useTexture.preload('/textures/bedroom/roughness_bedroom.webp');
useTexture.preload('/textures/bedroom/light_bedroom.webp');
