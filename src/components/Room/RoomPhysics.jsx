import React, { useMemo, useRef, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];
const curtainPosition = [-0.1, 1, -3.9];
const visible = false;

const Room = ({ position }) => {
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, []);

	return (
		<group>
			<RigidBody
				position={position}
				rotation={[0, playerPositionRoom < roomTotal / 2 ? 0 : Math.PI, 0]}
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
				{/* room curtain */}
				<mesh
					position={[1.35, 1, 5.4]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[6, 2, 1]}
				/>
				{/* window wall */}
				<mesh
					position={[4.35, 1.2, 0.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.1, 4, 10]}
				/>
				{/* tv wall */}
				<mesh
					position={[-1.6, 1.2, 3.8]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 4, 4]}
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
					position={[-1.65, 1.2, 0.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.1, 4, 10]}
				/>
				{/* sink */}
				<mesh
					position={[-1.73, 0.3, -3.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 1, 0.8]}
				/>
				{/* toilets wall */}
				<mesh
					position={[-1.85, 1.2, -2.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 3, 0.4]}
				/>
				{/* toilets */}
				<mesh
					position={[-1.1, 0.2, -2.2]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.6, 0.5, 0.4]}
				/>
				{/* bathtub wall */}
				<mesh
					position={[0.85, 1.2, -3.9]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.2, 4, 0.1]}
				/>
				{/* bathtub */}
				<mesh
					position={[-0.8, 0, -3.81]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[2.1, 0.9, 0.05]}
				/>
				{/* bathroom wall */}
				<mesh
					position={[1.5, 1.2, -3.85]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.1, 4, 1.6]}
				/>
				{/* bed */}
				<mesh
					position={[-0.5, 0, 0]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.9, 1.1, 1.8]}
				/>
				{/* nightstand left */}
				<mesh
					position={[-1.5, 0.4, 1.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.75, 1.1, 0.75]}
				/>
				{/* nightstand right */}
				<mesh
					position={[-1.5, 0.9, -1.3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.1, 0.1, 0.75]}
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

				{/* Desk horizontal */}
				<mesh
					position={[4.0, 0.8, -0.24]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.6, 0.1, 1.8]}
				/>
				{/* Desk Bin  */}
				<mesh
					position={[4.25, 0.2, -0.07]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.3, 1, 0.3]}
				/>
				{/* Desk left */}
				<mesh
					position={[4, 0.45, -1.15]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.6, 0.8, 0.1]}
				/>
				{/* Desk door right */}
				<mesh
					position={[4, 0.45, 0.65]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.6, 0.8, 0.01]}
				/>
				{/* Desk door left */}
				<mesh
					position={[4, 0.45, 0.05]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.6, 0.8, 0.05]}
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
					position={[2.2, 0, 3.09]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.5, 0.75, 1.2]}
				/>
				{/* plant */}
				<mesh
					position={[2.8, 0, 4.45]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.05, 1, 0.05]}
				/>
				{/* couch right */}
				<mesh
					position={[3.8, 0, 3]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 0.8, 2.4]}
				/>
				{/* couch backrest */}
				<mesh
					position={[4.4, 0.45, 3.4]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 0.6, 1.6]}
				/>
				{/* couch left */}
				<mesh
					position={[3.8, 0, 2.1]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1, 1.2, 1]}
				/>
				{/* corridor */}
				<mesh
					position={[-0.1, 0.5, -4.7]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[4.65, 4, 0.1]}
				/>
				{/* shoes  */}
				<mesh
					position={[1.7, 0, -3.7]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.3, 0.85, 0.25]}
				/>
				{/* door wall */}
				<mesh
					position={[4, 1.2, -4.7]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.8, 4, 0.05]}
				/>
				{/* door ceiling */}
				<mesh
					position={[2.91, 2.8, -4.7]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[1.35, 0.8, 0.05]}
				/>
				{/* curtain left */}
				<mesh
					position={[-1.3, 1, -3.8]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.4, 3, 0.02]}
				/>
				{/* curtain right */}
				<mesh
					position={[-0.1, 1, -3.8]}
					geometry={boxGeometry}
					material={wallMaterial}
					scale={[0.4, 3, 0.02]}
				/>
			</RigidBody>
		</group>
	);
};

const Curtain = ({ position }) => {
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const wallMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color: 'slategrey',
			opacity: visible ? 0.8 : 0,
			transparent: true,
		});
	}, []);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const curtainRef = useRef();
	const curtainOffset = useMemo(
		() => (bathroomCurtain ? 5 : 0),
		[bathroomCurtain]
	);

	useEffect(() => {
		if (curtainRef.current) {
			const newCurtainPosition = new THREE.Vector3(
				position[0] + curtainPosition[0],
				position[1] + curtainPosition[1] + curtainOffset,
				position[2] + curtainPosition[2]
			);
			curtainRef.current.setTranslation(newCurtainPosition);
		}
	}, [curtainOffset, position]);

	return (
		<RigidBody
			ref={curtainRef}
			position={[
				position[0] + curtainPosition[0],
				position[1] + curtainPosition[1],
				position[1] + curtainPosition[2],
			]}
			rotation={[0, playerPositionRoom < roomTotal / 2 ? 0 : Math.PI, 0]}
			type="kinematicPosition"
			restitution={0.2}
			friction={0}
		>
			{/* curtain */}
			<mesh
				position={[0, 0, 0]}
				geometry={boxGeometry}
				material={wallMaterial}
				scale={[2, 2, 0.1]}
			/>
		</RigidBody>
	);
};

export default function RoomPhysics() {
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
		<group>
			<Room position={position} />
			<Curtain position={position} />
		</group>
	);
}
