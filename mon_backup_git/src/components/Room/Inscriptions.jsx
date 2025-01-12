import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const inscriptions = [
	{
		text: "Don't look at them",
		position: [2, 1.5, -3],
		rotation: [0, Math.PI / 4, 0],
	},
	{
		text: "They're always listening",
		position: [-3, 2, 1],
		rotation: [0, -Math.PI / 6, 0],
	},
	{
		text: "They're always watching",
		position: [0, 2.5, 4],
		rotation: [0, Math.PI, 0],
	},
	{
		text: "You can't escape",
		position: [-2, 1, -2],
		rotation: [0, Math.PI / 2, 0],
	},
	{
		text: 'DONT TRUST MIRRORS',
		position: [0, 2, 4],
		rotation: [0, Math.PI, 0],
	},
	{
		text: 'THEY KNOW YOUR ARE HERE',
		position: [0, 0, 0],
		rotation: [0, 0, 0],
	},
];

export default function Inscriptions() {
	const textMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({ color: '#8A0303' });
	}, []);

	return (
		<group>
			{inscriptions.map((inscription, index) => (
				<Text
					key={index}
					font={'/Redrum.otf'}
					position={inscription.position}
					rotation={inscription.rotation}
					material={textMaterial}
					scale={0.2}
				>
					{inscription.text}
				</Text>
			))}
		</group>
	);
}
