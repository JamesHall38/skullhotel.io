import React, { useMemo } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';

export default function CorridorStart(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');

	const [colorMap] = [useKTX2('/textures/corridor/corridor_color_etc1s.ktx2')];

	useMemo(() => {
		[colorMap].forEach((texture) => {
			texture.flipY = false;
		});
		colorMap.colorSpace = THREE.SRGBColorSpace;
	}, [colorMap]);

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
		});
	}, [colorMap]);

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
