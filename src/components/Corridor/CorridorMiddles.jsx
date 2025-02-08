import { useGLTF } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import React, { useMemo } from 'react';
import WoodMaterial from '../materials/WoodMaterial';
import WallsMaterial from '../materials/WallsMaterial';
import CarpetMaterial from '../materials/CarpetMaterial';
import DoorFrameMaterial from '../materials/DoorFrameMaterial';
import LampMaterial from '../materials/LampMaterial';

const CORRIDORLENGHT = 5.95;

function CorridorMiddle(props) {
	const { nodes } = useGLTF('/models/corridor.glb');

	const woodMaterial = WoodMaterial();
	const wallsMaterial = WallsMaterial();
	const carpetMaterial = CarpetMaterial();
	const doorFrameMaterial = DoorFrameMaterial();
	const lampMaterial = LampMaterial();

	return (
		<group {...props}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Lamp.geometry}
				material={lampMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.Metal.geometry}
				material={doorFrameMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.MiddleFloor.geometry}
				material={carpetMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.MiddleWalls.geometry}
				material={wallsMaterial()}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.MiddleWood.geometry}
				material={woodMaterial()}
			/>
		</group>
	);
}

function CorridorMiddles(props) {
	const roomTotal = useGame((state) => state.roomTotal / 2);

	const corridors = useMemo(
		() =>
			[...Array(roomTotal)].map((_, index) => (
				<CorridorMiddle
					key={index}
					position={[-index * CORRIDORLENGHT, 0, 0]}
				/>
			)),
		[roomTotal]
	);

	return (
		<group {...props} dispose={null}>
			{corridors}
		</group>
	);
}

export default CorridorMiddles;

// useGLTF.preload('/models/corridor.glb');
