import { useGLTF, useTexture } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import React, { useMemo } from 'react';
import * as THREE from 'three';

const CORRIDORLENGHT = 5.95;

function CorridorMiddle(props) {
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
		const geo = nodes.CorridorMiddle.geometry.clone();
		if (geo.attributes['uv1']) {
			geo.setAttribute('uv', geo.attributes['uv1']);
		}
		return geo;
	}, [nodes.CorridorMiddle.geometry]);

	const material = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
		});
	}, [colorMap, roughnessMap]);

	const frameGeometry = useMemo(
		() => nodes.Plane006.geometry.clone(),
		[nodes.Plane006.geometry]
	);
	const luminariaGeometry = useMemo(
		() => nodes.Plane006_1.geometry.clone(),
		[nodes.Plane006_1.geometry]
	);
	const lampGeometry = useMemo(
		() => nodes.Plane006_2.geometry.clone(),
		[nodes.Plane006_2.geometry]
	);

	const staticMeshes = useMemo(
		() => (
			<>
				<mesh
					castShadow
					receiveShadow
					geometry={frameGeometry}
					material={materials.Frame}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={luminariaGeometry}
					material={materials.Luminaria}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={lampGeometry}
					material={materials.Lamp}
				/>
			</>
		),
		[
			frameGeometry,
			luminariaGeometry,
			lampGeometry,
			materials.Frame,
			materials.Luminaria,
			materials.Lamp,
		]
	);

	return (
		<group {...props}>
			{staticMeshes}
			<mesh geometry={geometry} material={material} castShadow receiveShadow />
		</group>
	);
}

function CorridorMiddles(props) {
	const roomTotal = useGame((state) => state.roomTotal / 2);

	const corridors = useMemo(
		() =>
			[...Array(roomTotal)].map((_, index) => (
				<CorridorMiddle
					key={index}
					position={[-index * CORRIDORLENGHT, 0, 0]}
				/>
			)),
		[roomTotal]
	);

	return (
		<group {...props} dispose={null}>
			{corridors}
		</group>
	);
}

export default CorridorMiddles;

useGLTF.preload('/models/corridor.glb');
useTexture.preload([
	'/textures/corridor/corridor_color.webp',
	'/textures/corridor/corridor_roughness.webp',
]);
