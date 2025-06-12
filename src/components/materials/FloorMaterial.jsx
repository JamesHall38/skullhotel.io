import { useMemo } from 'react';
import { useKTX2 } from '@react-three/drei';
import * as THREE from 'three';

export default function FloorMaterial({ transparent = false } = {}) {
	const [colorMap, roughnessMap] = [
		useKTX2('/textures/floor/floor_color_etc1s.ktx2'),
		useKTX2('/textures/floor/floor_roughness_etc1s.ktx2'),
	];

	const floorMaterial = useMemo(() => {
		[colorMap, roughnessMap].forEach((texture) => {
			texture.flipY = false;
			texture.colorSpace = THREE.SRGBColorSpace;
		});

		const material = new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
			roughness: 3.5,
			transparent: transparent,
			opacity: 1,
			bumpMap: roughnessMap,
		});

		material.onBeforeCompile = (shader) => {
			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <roughnessmap_fragment>',
				`
				float roughnessFactor = roughness;
				#ifdef USE_ROUGHNESSMAP
					vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
					roughnessFactor *= texelRoughness.g;
				#endif
				`
			);
		};

		material.map.wrapS = THREE.RepeatWrapping;
		material.map.wrapT = THREE.RepeatWrapping;
		material.roughnessMap.wrapS = THREE.RepeatWrapping;
		material.roughnessMap.wrapT = THREE.RepeatWrapping;

		material.castShadow = true;
		material.receiveShadow = true;
		material.needsUpdate = true;

		return material;
	}, [colorMap, roughnessMap, transparent]);

	return () => floorMaterial.clone();
}
