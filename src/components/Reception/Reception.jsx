import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import Metal from './Metal';
import * as THREE from 'three';
import Receptionist from './Receptionist';

export default function Reception() {
	const { scene } = useGLTF('/models/reception/reception.glb');
	const bakedTexture = useTexture('/textures/reception/bakedReception.webp');
	const bumpMap = useTexture('/textures/reception/bumpReception.webp');
	const roughnessMap = useTexture(
		'/textures/reception/roughnessreception.webp'
	);
	const lightMap = useTexture('/textures/reception/lightReception.webp');

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
	}, [scene, bakedTexture, lightMap, bumpMap, roughnessMap]);

	return (
		<group rotation={[0, Math.PI / 2, 0]} position={[9.8, 0, -0.15]}>
			<Receptionist />
			<Metal />
			<primitive object={scene} />
		</group>
	);
}

useGLTF.preload('/models/reception/reception.glb');
useTexture.preload('/textures/reception/bakedReception.webp');
useTexture.preload('/textures/reception/lightReception.webp');
useTexture.preload('/textures/reception/bumpReception.webp');
useTexture.preload('/textures/reception/roughnessreception.webp');
