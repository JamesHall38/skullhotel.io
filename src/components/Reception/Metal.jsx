import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import useLight from '../../hooks/useLight';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

export default function Metal() {
	const { nodes, materials } = useGLTF('/models/reception/reception_metal.glb');
	const receptionLight1 = useLight((state) => state.receptionLight1);

	const metalParts = useMemo(
		() => [
			{ name: 'eyes', label: 'Eyes' },
			{ name: 'frame', label: 'Frame' },
			{ name: 'gold', label: 'Gold' },
			{ name: 'metal', label: 'Metal' },
			{ name: 'text', label: 'Text' },
			{ name: 'exit', label: 'Exit' },
			{ name: 'exit_1', label: 'Exit 1' },
			{ name: 'exit_2', label: 'Exit 2' },
		],
		[]
	);

	const { loadedItems } = useProgressiveLoad(metalParts, 'Metal');

	const visibleParts = useMemo(() => {
		return metalParts.reduce((acc, part) => {
			acc[part.name] = loadedItems.some((item) => item.name === part.name);
			return acc;
		}, {});
	}, [loadedItems, metalParts]);

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
			{visibleParts.eyes && (
				<mesh castShadow receiveShadow geometry={nodes.Eyes.geometry}>
					<meshBasicMaterial color={'#fff'} />
				</mesh>
			)}
			{visibleParts.frame && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Frame.geometry}
					material={materials.Frame}
				/>
			)}
			{visibleParts.gold && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Gold.geometry}
					material={materials.Gold}
				/>
			)}
			{visibleParts.metal && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Metal.geometry}
					material={materials.Metal}
				/>
			)}
			{visibleParts.text && (
				<>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Text.geometry}
						material={textMaterial}
					/>
				</>
			)}
			{visibleParts.exit && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.exit.geometry}
					material={materials.LedGreen}
				/>
			)}
			{visibleParts.exit_1 && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.exit_1.geometry}
					material={materials.LedRed}
				/>
			)}
			{visibleParts.exit_2 && (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.exit_2.geometry}
					material={materials.Iron}
				/>
			)}
		</group>
	);
}

useGLTF.preload('/models/reception/reception_metal.glb');
