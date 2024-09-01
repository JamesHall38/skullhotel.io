import { useEffect, useMemo } from 'react';
import { useGLTF, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import Metal from './Metal';
import Receptionist from './Receptionist';

export default function Reception() {
	const { scene } = useGLTF('/models/reception/reception.glb');
	const bakedTexture = useTexture('/textures/reception/baked_reception.webp');
	const bumpMap = useTexture('/textures/reception/bump_reception.webp');
	const roughnessMap = useTexture(
		'/textures/reception/roughness_reception.webp'
	);
	const lightMap = useTexture('/textures/reception/light_reception.webp');

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
	}, [scene, bakedTexture, lightMap, bumpMap, roughnessMap]);

	const textMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({ color: '#8A0303' });
	}, []);

	return (
		<group rotation={[0, Math.PI / 2, 0]} position={[9.8, 0, -0.15]}>
			<Receptionist />
			<Metal />
			<primitive object={scene} />
			<Text
				font={'/Redrum.otf'}
				position={[0, 2, 3.65]}
				material={textMaterial}
				scale={0.2}
				rotation={[0, Math.PI, 0]}
			>
				If you see or hear one of them
			</Text>
			<Text
				font={'/Redrum.otf'}
				position={[0, 1.75, 3.65]}
				material={textMaterial}
				scale={0.2}
				rotation={[0, Math.PI, 0]}
			>
				turn around
			</Text>
		</group>
	);
}

useGLTF.preload('/models/reception/reception.glb');
useTexture.preload('/textures/reception/baked_reception.webp');
useTexture.preload('/textures/reception/light_reception.webp');
useTexture.preload('/textures/reception/bump_reception.webp');
useTexture.preload('/textures/reception/roughness_reception.webp');
