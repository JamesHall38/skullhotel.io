import { useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function MobileCorridor() {
	const { scene } = useGLTF('/models/mobile_corridor.glb');
	const { nodes, materials } = useGLTF('/models/mobile_corridor_metal.glb');
	const bakedTexture = useTexture('/textures/mobile_corridor.webp');

	bakedTexture.flipY = false;
	bakedTexture.colorSpace = THREE.SRGBColorSpace;

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
				});

				child.material = material;
				child.material.needsUpdate = true;
			}
		});
	}, [scene, bakedTexture]);

	return (
		<group position={[1, 0, 0]}>
			<primitive object={scene} />
			<group>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane001.geometry}
					material={materials.Frame}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Plane001_1.geometry}
					material={materials.Material}
				/>
			</group>
		</group>
	);
}

useGLTF.preload('/models/mobile_corridor.glb');
useGLTF.preload('/models/mobile_corridor_metal.glb');
useTexture.preload('/textures/mobile_corridor.webp');
