import { useMemo } from 'react';
import { useKTX2 } from '@react-three/drei';
import * as THREE from 'three';

export default function FabricMaterial({ isGrayscale = false }) {
	const colorMap = useKTX2('/textures/fabric/fabric_color_etc1s.ktx2');

	useMemo(() => {
		colorMap.colorSpace = THREE.SRGBColorSpace;
		colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
		colorMap.repeat.set(5, 5);
	}, [colorMap]);

	const fabricMaterial = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			map: colorMap,
			color: isGrayscale ? '#D0D0D0' : 'white',
		});

		if (isGrayscale) {
			material.onBeforeCompile = (shader) => {
				shader.fragmentShader = shader.fragmentShader.replace(
					'#include <map_fragment>',
					`
					#include <map_fragment>
					diffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)));
					`
				);
			};
		}

		material.castShadow = true;
		material.receiveShadow = true;
		material.needsUpdate = true;

		return material;
	}, [colorMap, isGrayscale]);

	return fabricMaterial;
}
