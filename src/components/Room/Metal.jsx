import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function Metal(props) {
	const { nodes, materials } = useGLTF('/models/room/metal.glb');
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube018.geometry}
				material={materials.Frame}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube018_1.geometry}
				material={materials.Metal}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube018_2.geometry}
				material={materials.Gold}
			/>
		</group>
	);
}
