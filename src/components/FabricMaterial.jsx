import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function FabricMaterial({ isGrayscale = false }) {
	const colorMap = useTexture('/textures/fabric/fabric_color.webp');

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

useTexture.preload('/textures/fabric/fabric_color.webp');