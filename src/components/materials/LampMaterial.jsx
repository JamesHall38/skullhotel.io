import { useMemo } from 'react';
import * as THREE from 'three';

export default function LampMaterial({ transparent = false } = {}) {
	const lampMaterial = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(0xfff5e1),
			roughness: 0.3,
			metalness: 0,
			transparent: transparent,
			opacity: 0.5,
		});

		material.castShadow = true;
		material.receiveShadow = true;
		material.transparent = true;
		material.needsUpdate = true;

		return material;
	}, [transparent]);

	return () => lampMaterial.clone();
}
