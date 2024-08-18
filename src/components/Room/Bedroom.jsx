import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Bedroom() {
	const { scene } = useGLTF('/models/room/bedroom.glb');
	const bakedTexture = useTexture('/textures/bedroom/bakedBedroom.webp');
	const bumpMap = useTexture('/textures/bedroom/bumpBedroom.webp');
	const roughnessMap = useTexture('/textures/bedroom/roughnessBedroom.webp');
	const lightMap = useTexture('/textures/bedroom/lightBedroom.webp');

	bakedTexture.flipY = false;
	bumpMap.flipY = false;
	roughnessMap.flipY = false;
	lightMap.flipY = false;

	bakedTexture.colorSpace = THREE.SRGBColorSpace;
	lightMap.colorSpace = THREE.SRGBColorSpace;

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
					bumpMap,
					roughnessMap,
					lightMap,
					bumpScale: 15,
					lightMapIntensity: 1.0,
				});

				child.castShadow = true;
				child.receiveShadow = true;
				child.material = material;
				child.material.needsUpdate = true;
			}
		});
	}, [scene, bakedTexture, lightMap, bumpMap, roughnessMap]);

	return <primitive object={scene} />;
}

useGLTF.preload('/models/room/bedroom.glb');
useTexture.preload('/textures/bedroom/bakedBedroom.webp');
useTexture.preload('/textures/bedroom/bumpBedroom.webp');
useTexture.preload('/textures/bedroom/roughnessBedroom.webp');
useTexture.preload('/textures/bedroom/lightBedroom.webp');
