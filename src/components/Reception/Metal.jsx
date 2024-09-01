import { useGLTF } from '@react-three/drei';

export default function Metal(props) {
	const { nodes, materials } = useGLTF('/models/reception/reception_metal.glb');
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.gold.geometry}
				material={materials['Gold']}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.metal.geometry}
				material={materials['Metal']}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/reception_metal.glb');
