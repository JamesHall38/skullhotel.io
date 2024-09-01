import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Livingroom() {
	const { scene } = useGLTF('/models/room/livingroom.glb');
	const bakedTexture = useTexture('/textures/livingroom/baked_livingroom.webp');
	const bumpMap = useTexture('/textures/livingroom/bump_livingroom.webp');
	const roughnessMap = useTexture(
		'/textures/livingroom/roughness_livingroom.webp'
	);
	const lightMap = useTexture('/textures/livingroom/light_livingroom.webp');

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
					lightMapIntensity: 4.0,
				});

				child.castShadow = true;
				child.receiveShadow = true;
				child.material = material;
				child.material.needsUpdate = true;
			}
		});
	}, [scene, bakedTexture, lightMap, roughnessMap, bumpMap]);

	return <primitive object={scene} />;
}

useGLTF.preload('/models/room/livingroom.glb');
useTexture.preload('/textures/livingroom/baked_livingroom.webp');
useTexture.preload('/textures/livingroom/light_livingroom.webp');
useTexture.preload('/textures/livingroom/bump_livingroom.webp');
useTexture.preload('/textures/livingroom/roughness_livingroom.webp');
