import React, { useMemo, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];

export default function RoomPhysics() {
	const visible = false;
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const { camera } = useThree();
	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, [visible]);

	const rigidBodyRef = useRef();

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomTotal / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		} else {
			calculatedPosition = [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}

		if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		} else if (camera.position.x <= 8 && camera.position.x > 4.4) {
			calculatedPosition = [3.02, 0, 7.9];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera.position.x]);

	return (
		<RigidBody
			position={position}
			rotation={[0, playerPositionRoom < roomTotal / 2 ? 0 : Math.PI, 0]}
			ref={rigidBodyRef}
			type="kinematicPosition"
			restitution={0.2}
			friction={0}
		>
			{/* ceiling */}
			<mesh
				position={[0, 4, 0]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[10, 1, 10]}
			/>
			{/* window wall */}
			<mesh
				position={[4.35, 1.2, 0.3]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[0.1, 4, 10]}
			/>
			{/* couch wall */}
			<mesh
				position={[1, 1.2, 5.35]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[10, 4, 0.1]}
			/>
			{/* bed wall */}
			<mesh
				position={[-1.2, 1.2, 0.3]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[0.1, 4, 10]}
			/>
			{/* bed */}
			<mesh
				position={[-0.5, 0, 0]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[1.9, 1.1, 1.8]}
			/>
			{/* left to bed wall */}
			<mesh
				position={[-0.18, 1.2, 1.755]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[2, 4, 0.1]}
			/>
			{/* right to bed wall */}
			<mesh
				position={[0.06, 1.2, -1.75]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[3, 4, 0.1]}
			/>
			{/* bathtub */}
			<mesh
				position={[0.06, 1.2, -3.9]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[3, 4, 0.1]}
			/>
			{/* bathroom wall */}
			<mesh
				position={[1.5, 1.2, -3.85]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[0.1, 4, 1.6]}
			/>
			{/* TV stand */}
			<mesh
				position={[4.03, 1.2, -0.19]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[0.6, 4, 1.8]}
			/>
			{/* Couch left wall */}
			<mesh
				position={[3.5, 1.2, 1.5]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[1, 4, 0.02]}
			/>
			{/* Couch right wall */}
			<mesh
				position={[3.9, 1.2, 4.74]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[1, 4, 1]}
			/>
			{/* coffee table */}
			<mesh
				position={[2.78, 0, 3.12]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[0.7, 0.45, 0.7]}
			/>
			{/* couch */}
			<mesh
				position={[3.8, 0, 3]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[1, 0.8, 2.4]}
			/>
			{/* corridor */}
			<mesh
				position={[-0.1, 0.5, -4.7]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[4.65, 4, 0.1]}
			/>
		</RigidBody>
	);
}
