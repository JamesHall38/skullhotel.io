import { useEffect, useMemo, useRef } from 'react';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const lookingDown = new THREE.Vector3(0, -1, 0);
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];
const visible = false;

function getAdjustedPosition(initialPosition, isFacingRoom) {
	if (!isFacingRoom) return initialPosition;
	return [-initialPosition[0], initialPosition[1], -initialPosition[2]];
}

export default function Events() {
	// Game state
	const eventData = useGame((state) => state.eventData);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);

	// Events trigger states
	const roomLight = useGame((state) => state.roomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);

	const zoneBox = useRef();

	const position = useMemo(() => {
		if (playerPositionRoom >= roomTotal / 2) {
			return [
				-CORRIDORLENGTH * 2 +
					offset[0] +
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH +
					(playerPositionRoom >= roomTotal / 2 ? 0.2 : 0),
				offset[1],
				-offset[2] + 12.4,
			];
		} else {
			return [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}
	}, [roomTotal, playerPositionRoom]);

	// Generate box3 to detect collisions
	useEffect(() => {
		if (!eventData[playerPositionRoom] || eventData[playerPositionRoom]?.empty)
			return undefined;
		const isFacingRoom = playerPositionRoom >= roomTotal / 2;

		const getBox3 = (boxData, scale = [1, 1, 1]) => {
			const adjustedPosition = getAdjustedPosition(
				[
					position[0] + (boxData?.[0] || 0),
					position[1] + (boxData?.[1] || 0),
					position[2] + (boxData?.[2] || 0),
				],
				isFacingRoom
			);
			const min = new THREE.Vector3(
				adjustedPosition[0] - 0.5 * scale[0],
				adjustedPosition[1] + 0.5 * scale[1],
				adjustedPosition[2] - 0.5 * scale[2]
			);
			const max = new THREE.Vector3(
				adjustedPosition[0] + 0.5 * scale[0],
				adjustedPosition[1] + 1.5 * scale[1],
				adjustedPosition[2] + 0.5 * scale[2]
			);
			const box = new THREE.Box3(min, max);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const size = new THREE.Vector3();
			box.getSize(size);
			box.setFromCenterAndSize(center, size);
			return box;
		};

		zoneBox.current = getBox3(
			eventData[playerPositionRoom].position,
			eventData[playerPositionRoom].scale
		);
	}, [position, roomTotal, playerPositionRoom, eventData]);

	useFrame(({ camera, raycaster }) => {
		if (zoneBox.current) {
			raycaster.set(camera.position, lookingDown);
			if (raycaster.ray.intersectsBox(zoneBox.current)) {
				if (roomLight) {
					setRoomLight(false);
				}
			}
		}
	});

	return (
		<>
			{visible && (
				<group
					rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}
				>
					<mesh
						geometry={boxGeometry}
						position={[
							position[0] + (eventData[playerPositionRoom]?.position?.[0] || 0),
							position[1] + (eventData[playerPositionRoom]?.position?.[1] || 0),
							position[2] + (eventData[playerPositionRoom]?.position?.[2] || 0),
						]}
						scale={eventData[playerPositionRoom]?.scale}
					>
						<meshBasicMaterial
							color="purple"
							transparent={true}
							opacity={0.25}
						/>
					</mesh>
				</group>
			)}
		</>
	);
}
