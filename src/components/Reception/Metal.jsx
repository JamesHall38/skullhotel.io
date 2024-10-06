import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

export default function Metal(props) {
	const { nodes, materials } = useGLTF('/models/reception/reception_metal.glb');

	const lightBulbsMaterial = useMemo(() => {
		return new THREE.MeshBasicMaterial({ color: '#c0c0c0' });
	}, []);

	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.gold.geometry}
				material={materials.Gold}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.metal.geometry}
				material={materials.Metal}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.LightBulbs.geometry}
				material={lightBulbsMaterial}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.frame.geometry}
				material={materials.Frame}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/reception_metal.glb');
