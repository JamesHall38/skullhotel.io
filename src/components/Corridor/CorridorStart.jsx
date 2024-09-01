import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function CorridorStart(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');
	return (
		<group {...props} dispose={null}>
			<mesh geometry={nodes.Plane004.geometry} material={materials.Walls} />
			<mesh geometry={nodes.Plane004_1.geometry} material={materials.Floor} />
			<mesh
				geometry={nodes.Plane004_2.geometry}
				material={materials.DarkWood}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Plane004_3.geometry}
				material={materials.Frame}
			/>
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
