import React, { useMemo, useEffect, useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const offset = [3, 1, 1.5];
const visible = false;

export default function DoorframePhysics({ roomNumber }) {
	const roomTotal = useGame((state) => state.roomTotal);
	const doorframeRef = useRef(null);

	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, []);

	const position = useMemo(() => {
		let calculatedPosition = null;
		if (roomNumber >= roomTotal / 2)
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(roomNumber - roomTotal / 2 - 1) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		else
			calculatedPosition = [
				-(offset[0] - 5.91) - (roomNumber + 1) * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];

		return !roomNumber && roomNumber !== 0 ? offset : calculatedPosition;
	}, [roomNumber, roomTotal]);

	useEffect(() => {
		if (doorframeRef.current) {
			const newPosition = new THREE.Vector3(
				position[0],
				position[1],
				position[2]
			);
			doorframeRef.current.setNextKinematicTranslation(newPosition);
		}
	}, [position]);

	return (
		<group>
			<RigidBody
				ref={doorframeRef}
				friction={0}
				type="fixed"
				colliders="cuboid"
			>
				<mesh
					position={position}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[4.5, 3, 0.05]}
				/>
			</RigidBody>
		</group>
	);
}
