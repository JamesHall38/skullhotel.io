import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import useGameplaySettings from '../../hooks/useGameplaySettings';

const CORRIDORLENGTH = 5.95;

function InstancedModel({ model, count, positions, rotations }) {
	const meshRef = useRef();
	const tempsObject = useRef(new THREE.Object3D());

	useEffect(() => {
		if (meshRef.current) {
			positions.forEach((position, index) => {
				tempsObject.current.position.set(...position);
				tempsObject.current.rotation.set(...rotations[index]);
				tempsObject.current.scale.set(...(model.scale || [1, 1, 1]));
				tempsObject.current.updateMatrix();
				meshRef.current.setMatrixAt(index, tempsObject.current.matrix);
			});
			meshRef.current.instanceMatrix.needsUpdate = true;
		}
	}, [positions, rotations, model]);

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
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const [instancedChildren, setInstancedChildren] = useState([]);

	useEffect(() => {
		const positions = [];
		const rotations = [];

		for (let i = 0; i < roomCount / 2; i++) {
			positions.push([-2.925 - i * CORRIDORLENGTH, 0, 6.2]);
			rotations.push([0, 0, 0]);

			positions.push([2.885 - i * CORRIDORLENGTH, 0, -6.2]);
			rotations.push([0, Math.PI, 0]);
		}

		const newChildren = React.Children.map(children, (child) => {
			if (child.type === 'mesh') {
				const { geometry, material } = child.props;
				return (
					<InstancedModel
						model={{ geometry, material }}
						count={positions.length}
						positions={positions}
						rotations={rotations}
					/>
				);
			}
			return child;
		});

		setInstancedChildren(newChildren);
	}, [children, roomCount]);

	return <>{instancedChildren}</>;
};

export default InstancedModels;
