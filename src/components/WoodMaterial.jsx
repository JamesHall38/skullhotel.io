import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function WoodMaterial({ transparent = false } = {}) {
	const [colorMap, roughnessMap] = useTexture([
		'/textures/wood/wood_color.webp',
		'/textures/wood/wood_roughness.webp',
	]);

	useMemo(() => {
		[colorMap, roughnessMap].forEach((texture) => {
			texture.flipY = false;
			texture.colorSpace = THREE.SRGBColorSpace;
		});
	}, [colorMap, roughnessMap]);

	const woodMaterial = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
			roughness: 1.75,
			transparent: transparent,
			opacity: 1,
		});

		material.map.wrapS = THREE.RepeatWrapping;
		material.map.wrapT = THREE.RepeatWrapping;
		material.roughnessMap.wrapS = THREE.RepeatWrapping;
		material.roughnessMap.wrapT = THREE.RepeatWrapping;

		material.castShadow = true;
		material.receiveShadow = true;
		material.needsUpdate = true;

		return material;
	}, [colorMap, roughnessMap, transparent]);

	return () => woodMaterial.clone();
}

useTexture.preload([
	'/textures/wood/wood_color.webp',
	'/textures/wood/wood_roughness.webp',
]);
