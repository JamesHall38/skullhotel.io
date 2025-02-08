import React from 'react';
import { useGLTF } from '@react-three/drei';
import WoodMaterial from '../materials/WoodMaterial';
import WallsMaterial from '../materials/WallsMaterial';
import CarpetMaterial from '../materials/CarpetMaterial';
import DoorFrameMaterial from '../materials/DoorFrameMaterial';

export default function CorridorStart(props) {
	const { nodes } = useGLTF('/models/corridor.glb');

	const woodMaterial = WoodMaterial();
	const wallsMaterial = WallsMaterial();
	const carpetMaterial = CarpetMaterial();
	const doorFrameMaterial = DoorFrameMaterial();

	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={doorFrameMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.StartFloor.geometry}
				material={carpetMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.StartWalls.geometry}
				material={wallsMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.StartWood.geometry}
				material={woodMaterial()}
			/>
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
