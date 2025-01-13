import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const inscriptions = [
	{
		content: 'If you see a client inside a room',
		position: [13.4, 2, -1],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.2,
	},
	{
		content: ' turn around before he kills you',
		position: [13.4, 1.75, -1],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.2,
	},
	{
		content: 'Listen to hiding spots',
		position: [2.75, 1.77, 9.6],
		rotation: [0, Math.PI, 0],
		scale: 0.17,
	},
	{
		content: 'before opening them',
		position: [2.75, 1.55, 9.6],
		rotation: [0, Math.PI, 0],
		scale: 0.17,
	},
	{
		content: 'Always close the door before cleaning',
		position: [5.95, 2.33, 3.205],
		rotation: [0, 0, 0],
		scale: 0.135,
	},
	{
		content: 'If you hear knocking',
		position: [5.75, 2.17, 3.205],
		rotation: [0, 0, 0],
		scale: 0.135,
	},
	{
		content: 'hide',
		position: [6.75, 2.16, 3.205],
		rotation: [0, 0, 0],
		scale: 0.2,
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
					scale={inscription.scale}
				>
					{inscription.content}
				</Text>
			))}
		</group>
	);
}
