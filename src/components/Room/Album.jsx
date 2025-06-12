import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

export default function Album(props) {
	const { nodes, materials } = useGLTF('/models/room/album.glb');
	return (
		<group
			{...props}
			dispose={null}
			scale={1.1}
			position={[2.26, 0.39, 2.77]}
			rotation={[0, 0.53, 0]}
		>
			<mesh geometry={nodes.Cube005.geometry} material={materials.VinilCover} />
			<mesh geometry={nodes.Cube005_1.geometry} material={materials.Vinil} />
		</group>
	);
}

// useGLTF.preload('/models/room/album.glb');
