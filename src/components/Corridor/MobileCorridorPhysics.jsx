import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const visible = false;

export default function MobileCorridorPhysics() {
	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, []);

	return (
		<group>
			<RigidBody friction={0} type="fixed" colliders="cuboid">
				<mesh
					position={[2.3, 1.5, 1.52]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[3, 4, 0.05]}
				/>
				<mesh
					position={[3.8, 1.5, 1.15]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 4, 1]}
				/>
				<mesh
					position={[3.8, 1.5, -1.15]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 4, 1]}
				/>
			</RigidBody>
		</group>
	);
}
