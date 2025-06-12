import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

export default function CCBTrophy(props) {
	const { nodes, materials } = useGLTF('/models/ccbtrophy.glb');
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube005.geometry}
				material={materials['Gold wood.001']}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Cube005_1.geometry}
				material={materials.mat20}
			/>
		</group>
	);
}

// useGLTF.preload('/models/ccbtrophy.glb');
