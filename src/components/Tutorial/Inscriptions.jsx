import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const inscriptions = [
	{
		content: 'If you see a client inside a room',
		position: [13.49, 2, -1],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.2,
	},
	{
		content: ' turn around before he kills you',
		position: [13.49, 1.75, -1],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.2,
	},
	// {
	// 	content: 'Listen to hiding spots',
	// 	position: [2.75, 1.77, 9.6],
	// 	rotation: [0, Math.PI, 0],
	// 	scale: 0.17,
	// },
	// {
	// 	content: 'before opening them',
	// 	position: [2.75, 1.55, 9.6],
	// 	rotation: [0, Math.PI, 0],
	// 	scale: 0.17,
	// },
	// {
	// 	content: 'Always close the door before cleaning',
	// 	position: [5.95, 2.33, 3.205],
	// 	rotation: [0, 0, 0],
	// 	scale: 0.135,
	// },
	// {
	// 	content: 'If you hear knocking',
	// 	position: [5.75, 2.17, 3.205],
	// 	rotation: [0, 0, 0],
	// 	scale: 0.135,
	// },
	// {
	// 	content: 'hide',
	// 	position: [6.75, 2.16, 3.205],
	// 	rotation: [0, 0, 0],
	// 	scale: 0.2,
	// },

	{
		content: 'Listen at the bathroom door',
		position: [4.58, 1.9, 4.02],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.11,
	},
	{
		content: 'before opening it',
		position: [4.58, 1.75, 4.02],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.11,
	},

	{
		content: 'Close the doors behind you',
		position: [3.25, 1.5, 6.21],
		rotation: [0, 0, 0],
		scale: 0.17,
	},

	{
		content: 'If you hear knocking',
		position: [2.75, 1.77, 9.6],
		rotation: [0, Math.PI, 0],
		scale: 0.17,
	},
	{
		content: 'hide',
		position: [2.75, 1.5, 9.6],
		rotation: [0, Math.PI, 0],
		scale: 0.23,
	},
];

export default function Inscriptions({ endTitle }) {
	const textMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({ color: '#8A0303' });
	}, []);

	return (
		<group>
			{endTitle ? (
				<>
					<Text
						font={'/Redrum.otf'}
						position={[1.4, 1.9, 7.85]}
						rotation={[0, Math.PI / 2, 0]}
						scale={0.3}
						material={textMaterial}
					>
						Skull Hotel
					</Text>
				</>
			) : (
				inscriptions.map((inscription, index) => (
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
				))
			)}
		</group>
	);
}
