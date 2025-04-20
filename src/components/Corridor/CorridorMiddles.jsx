import { useGLTF } from '@react-three/drei';
import useGameplaySettings from '../../hooks/useGameplaySettings';
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
	const roomCount = useGameplaySettings((state) => state.roomCount);

	const corridors = useMemo(
		() =>
			[...Array(roomCount / 2)].map((_, index) => (
				<CorridorMiddle
					key={index}
					position={[-index * CORRIDORLENGHT, 0, 0]}
				/>
			)),
		[roomCount]
	);

	return (
		<group {...props} dispose={null}>
			{corridors}
		</group>
	);
}

export default CorridorMiddles;
