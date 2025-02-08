import { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import DoorWrapper from './DoorWrapper';
import * as THREE from 'three';
import WoodMaterial from '../materials/WoodMaterial';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export default function RoomDoor({ roomNumber }) {
	const { nodes, materials } = useGLTF('/models/doors/door.glb');
	const handleRef = useRef();
	const handleRotationRef = useRef(0);
	const isOpen = useDoor((state) => state.roomDoor[roomNumber]);
	const setOpen = useDoor((state) => state.setRoomDoor);
	const isHandlePressed = useDoor((state) => state.roomDoorHandle[roomNumber]);
	const setHandlePressed = useDoor((state) => state.setRoomDoorHandle);
	const setPlayerPositionRoom = useGame((state) => state.setPlayerPositionRoom);
	const woodMaterial = WoodMaterial();
	const textRef = useRef();

	const fontUrl = '/EB_Garamond_Regular.json';

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
				depth: 0.1,
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

	useFrame((_, delta) => {
		if (!handleRef.current) return;

		const targetRotation = isHandlePressed ? -Math.PI / 4 : 0;
		handleRotationRef.current = THREE.MathUtils.lerp(
			handleRotationRef.current,
			targetRotation,
			delta * 15
		);
		handleRef.current.rotation.z = handleRotationRef.current;
	});

	return (
		<DoorWrapper
			roomNumber={roomNumber}
			offset={[5.28, 0.97, 1.51]}
			isOpen={isOpen}
			setOpen={(value) => {
				setOpen(roomNumber, value);
				setPlayerPositionRoom(roomNumber);
			}}
			setHandlePressed={(value) => setHandlePressed(roomNumber, value)}
		>
			<mesh
				geometry={nodes.Cube003_4.geometry}
				castShadow
				receiveShadow
				material={woodMaterial()}
			/>
			<mesh
				geometry={nodes.Lock.geometry}
				castShadow
				receiveShadow
				material={lockMaterial}
			/>
			<mesh
				ref={handleRef}
				geometry={nodes.Handles.geometry}
				position={[-1.128, 0.105, 0]}
				material={materials.Handle}
				castShadow
				receiveShadow
			>
				<primitive object={nodes.Handles.geometry} />
			</mesh>
			<mesh
				geometry={nodes.Cube003.geometry}
				material={materials.Frame}
				castShadow
				receiveShadow
			/>
			<mesh
				geometry={nodes.Cube003_1.geometry}
				material={materials.Handle}
				castShadow
				receiveShadow
			/>
			<mesh
				geometry={nodes.Cube003_2.geometry}
				material={materials.Metal}
				castShadow
				receiveShadow
			/>
			<mesh
				geometry={nodes.Lock.geometry}
				material={materials.Lock}
				castShadow
				receiveShadow
			/>
			<mesh
				geometry={nodes.Cube003_5.geometry}
				material={materials.Plastic}
				castShadow
				receiveShadow
			/>
			<mesh
				ref={textRef}
				material={textMaterial}
				rotation-y={Math.PI}
				scale={[0.7, 0.7, 0.25]}
				position={[-0.58 - (roomNumber < 10 ? 0.04 : 0), 0.5, -0.02]}
				castShadow
				receiveShadow
			/>
		</DoorWrapper>
	);
}

useGLTF.preload('/models/doors/door.glb');
