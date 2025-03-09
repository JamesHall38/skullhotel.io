import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../../hooks/useGame';

export default function Inscriptions() {
	const [visibleInscriptions, setVisibleInscriptions] = useState([]);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const activeInscriptions = useGame((state) => state.activeInscriptions || []);

	const inscriptionSettings = [
		// bedroom
		{
			position: [1, 1.5, -1.69],
			rotation: [0, 0, 0],
		},
		{
			position: [0, 0.5, -1.69],
			rotation: [0, 0, 0],
		},
		{
			position: [1.7, 2.7, -1.55],
			rotation: [0.55, 0, 0.1],
		},

		{
			position: [-1, 2, 1.7],
			rotation: [0, Math.PI, 0],
		},
		{
			position: [0.2, 1, 1.7],
			rotation: [0, Math.PI, 0],
		},
		{
			position: [3.75, 1.5, 1.4],
			rotation: [0, Math.PI, 0],
		},
		{
			position: [-1.6, 1, 0.5],
			rotation: [0, Math.PI / 2, 0],
		},
		{
			position: [-1.6, 2, -1],
			rotation: [0, Math.PI / 2, 0],
		},
		{
			position: [-1.6, 2.67, 0.5],
			rotation: [0, Math.PI / 2, 0],
		},
		{
			position: [1.6, 2.65, 1.5],
			rotation: [-0.5, 3.3, 0],
		},
		{
			position: [4.31, 1.75, -2],
			rotation: [0, -Math.PI / 2, 0],
		},
		{
			position: [4.31, 0.5, -3],
			rotation: [0, -Math.PI / 2, 0],
		},

		// living room
		{
			position: [0, 2, 1.81],
			rotation: [0, 0, 0],
		},
		{
			position: [0.1, 1, 1.81],
			rotation: [0, 0, 0],
		},
		{
			position: [3.5, 1.75, 1.52],
			rotation: [0, 0, 0],
		},
		{
			position: [4.3, 2, 3],
			rotation: [0, -Math.PI / 2, 0],
		},

		{
			position: [4.3, 1, 2.5],
			rotation: [0, -Math.PI / 2, 0],
		},

		{
			position: [3.4, 1, 4.7],
			rotation: [0, -Math.PI / 2, 0],
		},
		{
			position: [-1, 1, 5.3],
			rotation: [0, Math.PI, 0],
		},
		{
			position: [1, 2.2, 5.3],
			rotation: [0, Math.PI, 0],
		},
		{
			position: [-1.28, 1, 3.5],
			rotation: [0, Math.PI / 2, 0],
		},
	];

	const fadeValues = useRef(new Array(inscriptionSettings.length).fill(0));

	const textMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({ color: '#8a0303' });
	}, []);

	useEffect(() => {
		const isActiveInRoom = activeInscriptions.includes(playerPositionRoom);

		if (isActiveInRoom) {
			const availableIndices = Array.from(
				{ length: inscriptionSettings.length },
				(_, i) => i
			);

			const interval = setInterval(() => {
				setVisibleInscriptions((prev) => {
					if (prev.length < inscriptionSettings.length) {
						const remainingIndices = availableIndices.filter(
							(i) => !prev.includes(i)
						);
						if (remainingIndices.length === 0) return prev;

						const randomIndex = Math.floor(
							Math.random() * remainingIndices.length
						);
						const selectedIndex = remainingIndices[randomIndex];

						return [...prev, selectedIndex];
					} else {
						clearInterval(interval);
						return prev;
					}
				});
			}, 50);

			return () => clearInterval(interval);
		} else {
			setVisibleInscriptions([]);
		}
	}, [playerPositionRoom, activeInscriptions, inscriptionSettings.length]);

	useFrame(() => {
		visibleInscriptions.forEach((index) => {
			if (fadeValues.current[index] < 1) {
				fadeValues.current[index] = Math.min(
					fadeValues.current[index] + 0.3,
					1
				);
			}
		});

		for (let i = 0; i < fadeValues.current.length; i++) {
			if (!visibleInscriptions.includes(i) && fadeValues.current[i] > 0) {
				fadeValues.current[i] = Math.max(fadeValues.current[i] - 0.3, 0);
			}
		}
	});

	return (
		<group>
			{inscriptionSettings.map((setting, index) => (
				<Text
					key={index}
					position={setting.position}
					rotation={setting.rotation}
					material={textMaterial}
					fontSize={0.3}
					font="/Redrum.otf"
					opacity={fadeValues.current[index]}
					visible={fadeValues.current[index] > 0}
				>
					HIDE
				</Text>
			))}
		</group>
	);
}
