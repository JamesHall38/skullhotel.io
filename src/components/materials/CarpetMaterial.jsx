import { useMemo, useEffect } from 'react';
import { useKTX2 } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

export default function CarpetMaterial({ transparent = false } = {}) {
	const performanceMode = useGame((state) => state.performanceMode);
	const [colorMap, roughnessMap] = [
		useKTX2('/textures/carpet/carpet_color_etc1s.ktx2'),
		useKTX2('/textures/carpet/carpet_roughness_etc1s.ktx2'),
	];

	useMemo(() => {
		[colorMap, roughnessMap].forEach((texture) => {
			texture.flipY = false;
			texture.colorSpace = THREE.SRGBColorSpace;
		});
	}, [colorMap, roughnessMap]);

	const carpetMaterial = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			map: colorMap,
			roughnessMap: roughnessMap,
			roughness: 1.75,
			transparent: transparent,
			opacity: 1,
			bumpMap: roughnessMap,
			bumpScale: 2,
		});

		material.map.wrapS = THREE.RepeatWrapping;
		material.map.wrapT = THREE.RepeatWrapping;
		material.roughnessMap.wrapS = THREE.RepeatWrapping;
		material.roughnessMap.wrapT = THREE.RepeatWrapping;

		material.castShadow = true;
		material.receiveShadow = true;
		material.needsUpdate = true;

		return material;
	}, [colorMap, roughnessMap, transparent]);

	useEffect(() => {
		carpetMaterial.needsUpdate = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [performanceMode]);

	return () => carpetMaterial.clone();
}
