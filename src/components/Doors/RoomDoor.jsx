import { useMemo } from 'react';
import { useGLTF, Text3D, Center } from '@react-three/drei';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import DoorWrapper from './DoorWrapper';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;

export default function RoomDoor({ roomNumber }) {
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	const isOpen = useDoor((state) => state.roomDoor[roomNumber]);
	const setOpen = useDoor((state) => state.setRoomDoor);
	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);

	const fontUrl = './EB_Garamond_Regular.json';

	const position = useMemo(() => {
		const offset = [5.28, 0.97, 1.51];
		if (!roomNumber && roomNumber !== 0) return offset;
		if (roomNumber >= roomTotal / 2)
			return [
				offset[0] +
					1.33 -
					CORRIDORLENGTH -
					(roomNumber - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		else
			return [
				-(offset[0] - 5.91) - roomNumber * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
	}, [roomNumber, roomTotal]);

	const lockMaterial = useMemo(
		() =>
			new THREE.MeshBasicMaterial({ color: isOpen ? '#00ff00' : '#ff0000' }),
		[isOpen]
	);

	return (
		<group dispose={null}>
			{/* <mesh
				castShadow
				receiveShadow
				geometry={nodes.DoorFrame.geometry}
				material={materials.Frame}
				position={position}
			/> */}
			<DoorWrapper
				roomNumber={roomNumber}
				offset={[5.28, 0.97, 1.51]}
				isOpen={isOpen}
				setOpen={(value) => {
					setOpen(roomNumber, value);
					setPlayerPositionRoom(roomNumber);
				}}
			>
				<group scale={1}>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Lock.geometry}
						// material={materials.Light}
						material={lockMaterial}
					/>

					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Handles.geometry}
						material={materials.Handle}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003.geometry}
						material={materials.Frame}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003_1.geometry}
						material={materials.Handle}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003_2.geometry}
						material={materials.Metal}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003_3.geometry}
						material={materials.Lock}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003_4.geometry}
						material={materials.Wood}
					/>
					<mesh
						castShadow
						receiveShadow
						geometry={nodes.Cube003_5.geometry}
						material={materials.Plastic}
					/>
					<Center position={[-0.675, 0.5, -0.05]}>
						<Text3D
							font={fontUrl}
							size={0.15}
							scale={[0.6, 0.6, 0.1]}
							rotation={[0, Math.PI, 0]}
						>
							{(roomNumber + 1).toString()}
							<meshStandardMaterial
								attach="material"
								// color="#BBA53D"
								color="#AFA795"
								roughness={0.15}
								metalness={0.9}
							/>
						</Text3D>
					</Center>
				</group>
			</DoorWrapper>

			{/* <group>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane001.geometry}
					material={materials['Material.001']}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane001_1.geometry}
					material={materials['Material.002']}
				/>
				
			</group> */}
		</group>
	);
}

useGLTF.preload('/models/doors/door.glb');
