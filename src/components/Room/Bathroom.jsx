import React, { useEffect, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

export default function Bathroom({ invert, ...props }) {
	const { scene: originalScene } = useGLTF('/models/room/bathroom.glb');
	const bathroomLight = useGame((state) => state.bathroomLight);
	const bakedTexture = useTexture('/textures/bathroom/baked_bathroom.webp');
	const bumpMap = useTexture('/textures/bathroom/bump_bathroom.webp');
	const roughnessMap = useTexture('/textures/bathroom/roughness_bathroom.webp');
	const lightMap = useTexture('/textures/bathroom/light_bathroom.webp');

	const materialsRef = useRef([]);

	const scene = originalScene.clone();

	bakedTexture.flipY = false;
	bumpMap.flipY = false;
	roughnessMap.flipY = false;
	lightMap.flipY = false;

	bakedTexture.colorSpace = THREE.SRGBColorSpace;
	lightMap.colorSpace = THREE.SRGBColorSpace;

	useEffect(() => {
		materialsRef.current = [];

		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
					bumpMap,
					roughnessMap,
					lightMap,
					bumpScale: 8,
					lightMapIntensity: 0,
				});

				child.castShadow = true;
				child.receiveShadow = true;
				child.material = material;
				child.material.needsUpdate = true;

				materialsRef.current.push(material);
			}
		});

		if (invert) {
			scene.scale.set(-1, 1, 1);
			scene.updateMatrixWorld();
		}
	}, [scene, bakedTexture, lightMap, bumpMap, roughnessMap, invert]);

	useEffect(() => {
		materialsRef.current.forEach((material) => {
			material.lightMapIntensity = bathroomLight ? 6 : 0;
			material.needsUpdate = true;
		});
	}, [bathroomLight]);

	return <primitive {...props} object={scene} />;
}

useGLTF.preload('/models/room/bathroom.glb');
useTexture.preload('/textures/bathroom/baked_bathroom.webp');
useTexture.preload('/textures/bathroom/bump_bathroom.webp');
useTexture.preload('/textures/bathroom/roughness_bathroom.webp');
useTexture.preload('/textures/bathroom/light_bathroom.webp');
