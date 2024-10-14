import { useGLTF } from '@react-three/drei';
import useGame from '../../hooks/useGame';

const CORRIDORLENGHT = 5.95;

export default function CorridorMiddles(props) {
	const { nodes, materials } = useGLTF('/models/corridor.glb');
	const roomTotal = useGame((state) => state.roomTotal / 2);

	return (
		<group {...props} dispose={null}>
			{[...Array(roomTotal)].map((_, index) => (
				<group key={index} position={[-index * CORRIDORLENGHT, 0, 0]}>
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
				</group>
			))}
		</group>
	);
}

useGLTF.preload('/models/corridor.glb');
