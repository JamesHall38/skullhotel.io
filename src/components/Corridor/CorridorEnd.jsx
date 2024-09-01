import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function CorridorEnd(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');
	return (
		<group {...props} dispose={null}>
			<mesh geometry={nodes.Plane.geometry} material={materials.Walls} />
			<mesh geometry={nodes.Plane_1.geometry} material={materials.Floor} />
			<mesh geometry={nodes.Plane_2.geometry} material={materials.DarkWood} />
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
