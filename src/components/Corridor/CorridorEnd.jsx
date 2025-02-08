import React from 'react';
import { useGLTF } from '@react-three/drei';
import WoodMaterial from '../materials/WoodMaterial';
import WallsMaterial from '../materials/WallsMaterial';
import CarpetMaterial from '../materials/CarpetMaterial';

export default function CorridorEnd(props) {
	const { nodes } = useGLTF('/models/corridor.glb');

	const woodMaterial = WoodMaterial();
	const wallsMaterial = WallsMaterial();
	const carpetMaterial = CarpetMaterial();

	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EndFloor.geometry}
				material={carpetMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EndWalls.geometry}
				material={wallsMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EndWood.geometry}
				material={woodMaterial()}
			/>
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
