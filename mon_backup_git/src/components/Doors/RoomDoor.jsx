import { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import DoorWrapper from './DoorWrapper';
import * as THREE from 'three';
import WoodMaterial from '../WoodMaterial';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export default function RoomDoor({ roomNumber }) {
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	const isOpen = useDoor((state) => state.roomDoor[roomNumber]);
	const setOpen = useDoor((state) => state.setRoomDoor);
	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);
	const woodMaterial = WoodMaterial();
	const textRef = useRef();

	const fontUrl = './EB_Garamond_Regular.json';

	const lockMaterial = useMemo(
		() =>
			new THREE.MeshBasicMaterial({ color: isOpen ? '#00ff00' : '#ff0000' }),
		[isOpen]
	);

	useEffect(() => {
		const loader = new FontLoader();
		loader.load(fontUrl, (font) => {
			const geometry = new TextGeometry((roomNumber + 1).toString(), {
				font: font,
				size: 0.15,
				height: 0.1,
				curveSegments: 12,
			});

			if (textRef.current) {
				textRef.current.geometry.dispose();
				textRef.current.geometry = geometry;
			}

			return () => {
				geometry.dispose();
			};
		});
	}, [roomNumber]);

	const textMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: '#AFA795',
				roughness: 0.15,
				metalness: 0.9,
			}),
		[]
	);

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[5.28, 0.97, 1.51]}
			isOpen={isOpen}
			setOpen={(value) => {
				setOpen(roomNumber, value);
				setPlayerPositionRoom(roomNumber);
			}}
		>
			<mesh geometry={nodes.Cube003_4.geometry} material={woodMaterial} />
			<mesh geometry={nodes.Lock.geometry} material={lockMaterial} />
			<mesh geometry={nodes.Handles.geometry} material={materials.Handle} />
			<mesh geometry={nodes.Cube003.geometry} material={materials.Frame} />
			<mesh geometry={nodes.Cube003_1.geometry} material={materials.Handle} />
			<mesh geometry={nodes.Cube003_2.geometry} material={materials.Metal} />
			<mesh geometry={nodes.Lock.geometry} material={materials.Lock} />
			<mesh geometry={nodes.Cube003_5.geometry} material={materials.Plastic} />
			<mesh
				ref={textRef}
				material={textMaterial}
				rotation-y={Math.PI}
				scale={[0.7, 0.7, 0.25]}
				position={[-0.58 - (roomNumber < 10 ? 0.04 : 0), 0.5, -0.02]}
			/>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/door.glb');
