import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

function BathroomMain({ invert, ...props }) {
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

	const [lightIntensity, setLightIntensity] = useState(0);
	const timeoutRef = useRef(null);

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
					lightMapIntensity: 6,
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
	}, [scene, bakedTexture, bumpMap, roughnessMap, lightMap, invert]);

	useEffect(() => {
		let intervalId;

		if (bathroomLight) {
			let intensity = 0;
			intervalId = setInterval(() => {
				intensity = Math.random() * 3;
				setLightIntensity(intensity);
			}, 50);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				clearInterval(intervalId);
				setLightIntensity(6);
			}, 1600);
		} else {
			if (intervalId) clearInterval(intervalId);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setLightIntensity(0);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [bathroomLight]);

	useEffect(() => {
		materialsRef.current.forEach((material) => {
			material.lightMapIntensity = lightIntensity;
			material.needsUpdate = true;
		});
	}, [lightIntensity]);

	return (
		<>
			<primitive {...props} object={scene} />
		</>
	);
}

export default function Bathroom() {
	return (
		<group>
			<BathroomMain key="bathroom1" />
			<BathroomMain invert key="bathroom2" position={[-3.32, 0.0, 0]} />
			<mesh
				position={[-1.65, 1.3, -3.25]}
				rotation={[0, Math.PI / 2, 0]}
				frustumCulled={false}
				renderOrder={-1}
			>
				<planeGeometry args={[2, 1]} />
				<meshPhysicalMaterial
					transparent
					polygonOffset
					opacity={0.6}
					polygonOffsetFactor={-1}
					roughness={0.1}
					metalness={1}
					color="white"
				/>
			</mesh>
		</group>
	);
}

useGLTF.preload('/models/room/bathroom.glb');
useTexture.preload('/textures/bathroom/baked_bathroom.webp');
useTexture.preload('/textures/bathroom/bump_bathroom.webp');
useTexture.preload('/textures/bathroom/roughness_bathroom.webp');
useTexture.preload('/textures/bathroom/light_bathroom.webp');
