import { useGLTF } from '@react-three/drei';

export default function Metal(props) {
	const { nodes, materials } = useGLTF('/models/reception/receptionMetal.glb');
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
				material={materials['aluminiu.003']}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/receptionMetal.glb');
