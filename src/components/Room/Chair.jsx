import React, { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';

const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];

export default function Chair() {
	const { nodes, materials } = useGLTF('/models/room/chair.glb');
	const chairRef = useRef();
	const { camera } = useThree();
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);

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

	useEffect(() => {
		if (chairRef.current) {
			const rigidBody = chairRef.current;
			rigidBody.setTranslation({
				x: position[0],
				y: position[1],
				z: position[2],
			});
			rigidBody.setRotation({ x: 0, y: 0, z: 0, w: 1 });
			rigidBody.setLinvel({ x: 0, y: 0, z: 0 });
			rigidBody.setAngvel({ x: 0, y: 0, z: 0 });
		}
	}, [position]);

	return (
		<RigidBody
			ref={chairRef}
			colliders="hull"
			mass={10}
			type="dynamic"
			position={position}
		>
			<group dispose={null}>
				<group position={[3.568, 0.2, -0.609]}>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.BSurfaceMesh002.geometry}
						material={materials.NEWCHAIRWITHNORMALS}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.BSurfaceMesh002_1.geometry}
						material={materials['Blacl plastic 002 normal']}
					/>
				</group>
			</group>
			<BallCollider args={[0.1]} position={[3.3, 0, -0.4]} />
			<BallCollider args={[0.1]} position={[3.8, 0, -0.4]} />
			<BallCollider args={[0.1]} position={[3.3, 0, -0.8]} />
			<BallCollider args={[0.1]} position={[3.8, 0, -0.8]} />
		</RigidBody>
	);
}

useGLTF.preload('/models/room/chair.glb');
