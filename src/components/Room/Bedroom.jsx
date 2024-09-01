import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Bedroom() {
	const { scene } = useGLTF('/models/room/bedroom.glb');
	const bakedTexture = useTexture('/textures/bedroom/baked_bedroom.webp');
	const bumpMap = useTexture('/textures/bedroom/bump_bedroom.webp');
	const roughnessMap = useTexture('/textures/bedroom/roughness_bedroom.webp');
	const lightMap = useTexture('/textures/bedroom/light_bedroom.webp');

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
					bumpScale: 8,
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
useTexture.preload('/textures/bedroom/baked_bedroom.webp');
useTexture.preload('/textures/bedroom/bump_bedroom.webp');
useTexture.preload('/textures/bedroom/roughness_bedroom.webp');
useTexture.preload('/textures/bedroom/light_bedroom.webp');
