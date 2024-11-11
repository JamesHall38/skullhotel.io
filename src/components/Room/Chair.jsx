import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';

const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];

export default function Chair() {
	const { nodes, materials } = useGLTF('/models/room/chair.glb');
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

	return (
		<group position={position}>
			<group dispose={null}>
				<group position={[3.568, 0.3, -0.609]}>
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
		</group>
	);
}

useGLTF.preload('/models/room/chair.glb');
