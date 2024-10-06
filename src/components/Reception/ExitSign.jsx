import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function ExitSign(props) {
	const { nodes, materials } = useGLTF('/models/reception/exit_sign.glb');
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit_1.geometry}
				material={materials['LedGreen.004']}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit_2.geometry}
				material={materials['LedRed.004']}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit_3.geometry}
				material={materials['Iron.004']}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/exit_sign.glb');
