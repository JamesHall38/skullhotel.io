import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function Painting(props) {
	const { nodes, materials } = useGLTF('/models/room/painting.glb');
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				// receiveShadow
				geometry={nodes.Abstract_Painting.geometry}
				material={materials.Abstract_Painting}
			/>
		</group>
	);
}

useGLTF.preload('/models/room/painting.glb');
