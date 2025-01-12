import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import useLight from '../../hooks/useLight';

export default function Metal() {
	const { nodes, materials } = useGLTF('/models/reception/reception_metal.glb');
	const receptionLight1 = useLight((state) => state.receptionLight1);

	const textMaterial = useMemo(() => {
		const opacity = receptionLight1.intensity > 0 ? 1 : 0;
		return new THREE.MeshBasicMaterial({
			color: '#ff0000',
			transparent: true,
			opacity: opacity,
		});
	}, [receptionLight1.intensity]);

	return (
		<group dispose={null}>
			<mesh castShadow receiveShadow geometry={nodes.Eyes.geometry}>
				<meshBasicMaterial color={'#fff'} />
			</mesh>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Frame.geometry}
				material={materials.Frame}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Gold.geometry}
				material={materials.Gold}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Metal.geometry}
				material={materials.Metal}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Text.geometry}
				material={textMaterial}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit.geometry}
				material={materials.LedGreen}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit_1.geometry}
				material={materials.LedRed}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.exit_2.geometry}
				material={materials.Iron}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/reception_metal.glb');
