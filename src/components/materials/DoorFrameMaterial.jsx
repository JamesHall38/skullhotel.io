import { useMemo } from 'react';
import * as THREE from 'three';

export default function DoorFrameMaterial({ transparent = false } = {}) {
	const metalMaterial = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(0x746f69),
			roughness: 0.485,
			metalness: 1,
			transparent: transparent,
			opacity: 1,
		});

		material.castShadow = true;
		material.receiveShadow = true;
		material.needsUpdate = true;

		return material;
	}, [transparent]);

	return () => metalMaterial.clone();
}
