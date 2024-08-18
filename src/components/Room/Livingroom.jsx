import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Livingroom() {
	const { scene } = useGLTF('/models/room/livingroom.glb');
	const bakedTexture = useTexture('/textures/livingroom/bakedLivingroom.webp');
	const bumpMap = useTexture('/textures/livingroom/bumpLivingroom.webp');
	const roughnessMap = useTexture(
		'/textures/livingroom/roughnessLivingroom.webp'
	);
	const lightMap = useTexture('/textures/livingroom/lightLivingroom.webp');

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
useTexture.preload('/textures/livingroom/bakedLivingroom.webp');
useTexture.preload('/textures/livingroom/lightLivingroom.webp');
useTexture.preload('/textures/livingroom/bumpLivingroom.webp');
useTexture.preload('/textures/livingroom/roughnessLivingroom.webp');
