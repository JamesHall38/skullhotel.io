import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function CorridorStart(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');

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
		const geo = nodes.CorridorStart.geometry.clone();
		if (geo.attributes['uv1']) {
			geo.setAttribute('uv', geo.attributes['uv1']);
		}
		return geo;
	}, [nodes.CorridorStart.geometry]);

	const material = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
		});
	}, [colorMap, roughnessMap]);

	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={materials.Frame}
			/>
			<mesh castShadow receiveShadow geometry={geometry} material={material} />
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
useTexture.preload([
	'/textures/corridor/corridor_color.webp',
	'/textures/corridor/corridor_roughness.webp',
]);
