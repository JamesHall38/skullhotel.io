import React, { useEffect, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

export default function Bathroom({ invert, ...props }) {
	const { scene: originalScene } = useGLTF('/models/room/bathroom.glb');
	const bathroomLight = useGame((state) => state.bathroomLight);
	const bakedTexture = useTexture('/textures/bathroom/bakedBathroom.webp');
	const bumpMap = useTexture('/textures/bathroom/bumpBathroom.webp');
	const roughnessMap = useTexture('/textures/bathroom/roughnessBathroom.webp');
	const lightMap = useTexture('/textures/bathroom/lightBathroom.webp');

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
					bumpScale: 15,
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
useTexture.preload('/textures/bathroom/bakedBathroom.webp');
useTexture.preload('/textures/bathroom/bumpBathroom.webp');
useTexture.preload('/textures/bathroom/roughnessBathroom.webp');
useTexture.preload('/textures/bathroom/lightBathroom.webp');
