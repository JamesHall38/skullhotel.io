import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

<<<<<<< Updated upstream
export default function Metal(props) {
=======
export default function Metal() {
>>>>>>> Stashed changes
	const { nodes, materials } = useGLTF('/models/reception/reception_metal.glb');

<<<<<<< Updated upstream
	const lightBulbsMaterial = useMemo(() => {
		return new THREE.MeshBasicMaterial({ color: '#c0c0c0' });
	}, []);
=======
	const textMaterial = useMemo(() => {
		const opacity = receptionLight1.intensity > 0 ? 1 : 0;
		return new THREE.MeshBasicMaterial({
			color: '#ff0000',
			transparent: true,
			opacity: opacity,
		});
	}, [receptionLight1.intensity]);
>>>>>>> Stashed changes

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
