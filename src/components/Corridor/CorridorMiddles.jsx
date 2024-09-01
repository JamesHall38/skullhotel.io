import { useState, useMemo, useEffect, useRef, Children } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';

const CORRIDORLENGHT = 5.95;

function InstancedModel({ model, count, positions }) {
	const meshRef = useRef();
	const tempObject = useMemo(() => new THREE.Object3D(), []);

	useEffect(() => {
		if (meshRef.current) {
			positions.forEach((position, index) => {
				tempObject.position.set(...position);
				tempObject.rotation.set(...(model.rotation || [0, 0, 0]));
				tempObject.scale.set(...(model.scale || [1, 1, 1]));
				tempObject.updateMatrix();
				meshRef.current.setMatrixAt(index, tempObject.matrix);
			});
			meshRef.current.instanceMatrix.needsUpdate = true;
		}
	}, [positions, model, tempObject]);

	return (
		<instancedMesh
			frustumCulled={false}
			ref={meshRef}
			args={[model.geometry, model.material, count]}
		>
			<primitive attach="geometry" object={model.geometry} />
			<primitive attach="material" object={model.material} />
		</instancedMesh>
	);
}

const InstancedModels = ({ children }) => {
	const roomTotal = useGame((state) => state.roomTotal / 2);
	const [instancedChildren, setInstancedChildren] = useState([]);

	useEffect(() => {
		const positions = [...Array(roomTotal)].map((_, i) => {
			return [-2.925 - i * CORRIDORLENGHT, 0, 6.2];
		});

		const newChildren = Children.map(children, (child) => {
			if (child.type === 'mesh') {
				const { geometry, material } = child.props;
				return (
					<InstancedModel
						model={{ geometry, material }}
						count={roomTotal}
						positions={positions}
					/>
				);
			}
			return child;
		});

		setInstancedChildren(newChildren);
	}, [children, roomTotal]);

	return <>{instancedChildren}</>;
};

export default function CorridorMiddles(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');
	return (
		<group position={[2.925, 0, -6.2]} {...props} dispose={null}>
			<InstancedModels>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane003.geometry}
					material={materials.Walls}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane003_1.geometry}
					material={materials.Floor}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane003_2.geometry}
					material={materials.DarkWood}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Vert001.geometry}
					material={materials['LUMINARIA.001']}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Vert001_1.geometry}
					material={materials['LAMP.001']}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane003_3.geometry}
					material={materials.Frame}
				/>
			</InstancedModels>
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
