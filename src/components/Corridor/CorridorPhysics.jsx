import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const visible = false;

export default function CorridorPhysics({ position }) {
	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, []);

	return (
		<group position={position}>
			<RigidBody friction={0} type="fixed" colliders="cuboid">
				<mesh
					position={[-3.2, 1.5, 0]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.5, 4, 2.8]}
				/>
				<mesh
					position={[-1.6, 2, -1.5]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[4, 4, 0.05]}
				/>
			</RigidBody>
		</group>
	);
}
