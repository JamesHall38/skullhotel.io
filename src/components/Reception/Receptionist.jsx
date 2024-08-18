import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

const Receptionist = () => {
	const group = useRef();
	const { nodes } = useGLTF('/models/reception/receptionist.glb');
	const isMad = false;
	const [conditionsMet, setConditionsMet] = useState(false);
	const [showPanel, setShowPanel] = useState(false);

	const eyesMaterial = useMemo(() => {
		return isMad
			? new THREE.MeshBasicMaterial({ color: '#ff0000' })
			: new THREE.MeshBasicMaterial({ color: '#ffffff' });
	}, [isMad]);

	useFrame((state) => {
		const { x, z } = state.camera.position;
		group.current.lookAt(x, 0, z);

		if (state.camera.position.x < 8) {
			setShowPanel(false);
		}

		if (z >= 0 && z <= 1.46 && x > 8) {
			setConditionsMet(true);
		} else {
			setConditionsMet(false);
		}
	});

	const handleClick = () => {
		if (conditionsMet) {
			setShowPanel(true);
			setTimeout(() => setShowPanel(false), 30000);
		}
	};

	return (
		<>
			<group
				onPointerDown={handleClick}
				ref={group}
				position={[-2.5, 0, 0.95]}
				scale={0.9}
				dispose={null}
			>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Eyes.geometry}
					material={eyesMaterial}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Skeleton.geometry}
					material={nodes.Skeleton.material}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Skull.geometry}
					material={nodes.Skull.material}
				/>
			</group>
			{showPanel && (
				<Html
					position={[-2.5, 1.5, 0.95]}
					style={{
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						padding: '10px',
						borderRadius: '5px',
						color: 'white',
						textAlign: 'center',
						width: '200px',
					}}
					center
					distanceFactor={4}
					onPointerDown={(e) => e.stopPropagation()}
				>
					WQSD to move Your objective is to refill the soap bottles, do the bed
					and open the window. You can train in the tutorial room on the right.
					Your objective is to tidy 10 rooms without disturbing the clients.
				</Html>
			)}
		</>
	);
};

useGLTF.preload('/models/reception/receptionist.glb');

export default Receptionist;
