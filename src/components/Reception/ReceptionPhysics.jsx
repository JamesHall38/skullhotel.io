import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const visible = false;

export default function ReceptionPhysics() {
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
				{/* entrance left */}
				<mesh
					position={[12.5, 1, -4.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[2.3, 4, 1]}
				/>
				{/* entrance right */}
				<mesh
					position={[8.8, 1, -4.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[2.3, 4, 1]}
				/>
				{/* right wall */}
				<mesh
					position={[5.95, 1, -3.19]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[4, 4, 4]}
				/>
				{/* left wall */}
				<mesh
					position={[13.5, 1, -2.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 4, 12]}
				/>
				{/* clocks wall */}
				<mesh
					position={[10.75, 1, 4.04]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[6, 4, 1]}
				/>
				{/* clocks right */}
				<mesh
					position={[7.25, 1, 2.4]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.3, 4, 2.4]}
				/>
				{/* left chair 1 */}
				<mesh
					rotation={[0, Math.PI / 3.5, 0]}
					position={[12.9, -0.1, -3.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.5, 1, 0.5]}
				/>
				{/* left chair 2 */}
				<mesh
					rotation={[0, Math.PI / 3.5, 0]}
					position={[13.15, 0.2, -3.5]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.2, 1, 0.5]}
				/>
				{/* right chair 1 */}
				<mesh
					rotation={[0, -Math.PI / 4.6, 0]}
					position={[8.65, -0.1, -3.22]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.5, 1, 0.5]}
				/>
				{/* right chair 2 */}
				<mesh
					rotation={[0, -Math.PI / 4.6, 0]}
					position={[8.35, 0.2, -3.45]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.2, 1, 0.5]}
				/>
				{/* reception front */}
				<mesh
					position={[10.75, 0.45, 1.45]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[3.55, 1, 0.3]}
				/>
				{/* reception back */}
				<mesh
					position={[10.75, 0.6, 1.9]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[2.5, 0.1, 0.4]}
				/>
				{/* reception right */}
				<mesh
					position={[9.22, 0.6, 1.58]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.65, 1.23, 0.65]}
				/>
				{/* reception left */}
				<mesh
					position={[12.26, 0.6, 1.58]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.65, 1.23, 0.65]}
				/>
				{/* tutorial room door */}
				{/* <mesh
					position={[13.5, 1, 3.7]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 4, 1]}
				/> */}
				{/* corridor door left */}
				<mesh
					position={[3.9, 1, 1.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.1, 4, 1]}
				/>
				{/* corridor door right */}
				<mesh
					position={[3.9, 1, -1.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.1, 4, 1]}
				/>
				{/* corridor left */}
				<mesh
					position={[2.2, 1, 1.5]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[3, 4, 0.05]}
				/>
				{/* corridor door ceiling */}
				<mesh
					position={[4, 3, 0]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 1, 2]}
				/>
				{/* tutorial corridor right wall */}
				<mesh
					position={[4.6, 2, 2.15]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.4, 4, 1.9]}
				/>
				{/* tutorial corridor ceiling */}
				<mesh
					position={[5.95, 3, 2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.5, 1, 1.7]}
				/>
			</RigidBody>
		</group>
	);
}
