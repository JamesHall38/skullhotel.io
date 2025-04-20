import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial } from 'three';
import useGame from '../../hooks/useGame';

export default function Model(props) {
	const roomLight = useGame((state) => state.roomLight);
	const { nodes, materials } = useGLTF('/models/room/ceiling_fan.glb');
	const groupRef = useRef();

	useFrame((_, delta) => {
		groupRef.current.rotation.y += delta * Math.PI;
	});

	return (
		<group {...props} dispose={null}>
			<group ref={groupRef} position={[1.436, 3.05, -0.115]}>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube041.geometry}
					material={materials['Old Wood']}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube041_1.geometry}
					material={
						roomLight
							? new MeshBasicMaterial({
									color: materials['Cloudy White Acrylic'].color,
							  })
							: materials['Cloudy White Acrylic']
					}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Cube041_2.geometry}
					material={materials['Metal Steel.004']}
				/>
			</group>
		</group>
	);
}
