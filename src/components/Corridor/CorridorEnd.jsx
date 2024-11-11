import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function CorridorEnd(props) {
	const { nodes } = useGLTF('/models/corridor.glb');

	const [colorMap, roughnessMap] = useTexture([
		'/textures/corridor/corridor_color.webp',
		'/textures/corridor/corridor_roughness.webp',
	]);

	useMemo(() => {
		[colorMap, roughnessMap].forEach((texture) => {
			texture.flipY = false;
		});
		colorMap.colorSpace = THREE.SRGBColorSpace;
	}, [colorMap, roughnessMap]);

	const geometry = useMemo(() => {
		const geo = nodes.CorridorEnd.geometry.clone();
		if (geo.attributes['uv1']) {
			geo.setAttribute('uv', geo.attributes['uv1']);
		}
		return geo;
	}, [nodes.CorridorEnd.geometry]);

	const material = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
		});
	}, [colorMap, roughnessMap]);

	return (
		<group {...props} dispose={null}>
			<mesh castShadow receiveShadow geometry={geometry} material={material} />
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
useTexture.preload([
	'/textures/corridor/corridor_color.webp',
	'/textures/corridor/corridor_roughness.webp',
]);
