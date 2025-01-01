import { useEffect, useMemo, useState, useRef } from 'react';
import { useGLTF, useTexture, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Metal from './Metal';
import Receptionist from './Receptionist';
import ExitSign from './ExitSign';
import useLight from '../../hooks/useLight';
import { useControls } from 'leva';

export default function Reception() {
	const { scene } = useGLTF('/models/reception/reception.glb');
	const bakedTexture = useTexture('/textures/reception/baked_reception.webp');
	const bumpMap = useTexture('/textures/reception/bump_reception.webp');
	const roughnessMap = useTexture(
		'/textures/reception/roughness_reception.webp'
	);
	const lightMap = useTexture('/textures/reception/light_reception.webp');

	bakedTexture.flipY = false;
	bumpMap.flipY = false;
	roughnessMap.flipY = false;
	lightMap.flipY = false;

	bakedTexture.colorSpace = THREE.SRGBColorSpace;
	lightMap.colorSpace = THREE.SRGBColorSpace;

	const materialRef = useRef();
	const receptionLight1 = useLight((state) => state.receptionLight1);
	const receptionLight2 = useLight((state) => state.receptionLight2);
	const receptionLight3 = useLight((state) => state.receptionLight3);
	const setReceptionLight1 = useLight((state) => state.setReceptionLight1);

	useControls(
		'Reception Lights',
		{
			receptionLight1Color: {
				value: receptionLight1.color,
				onChange: (v) =>
					useLight.getState().setReceptionLight1(v, receptionLight1.intensity),
			},
			receptionLight1Intensity: {
				value: receptionLight1.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) =>
					useLight.getState().setReceptionLight1(receptionLight1.color, v),
			},
			receptionLight2Color: {
				value: receptionLight2.color,
				onChange: (v) =>
					useLight.getState().setReceptionLight2(v, receptionLight2.intensity),
			},
			receptionLight2Intensity: {
				value: receptionLight2.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) =>
					useLight.getState().setReceptionLight2(receptionLight2.color, v),
			},
			receptionLight3Color: {
				value: receptionLight3.color,
				onChange: (v) =>
					useLight.getState().setReceptionLight3(v, receptionLight3.intensity),
			},
			receptionLight3Intensity: {
				value: receptionLight3.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) =>
					useLight.getState().setReceptionLight3(receptionLight3.color, v),
			},
		},
		{
			collapsed: true,
		}
	);

	// Constant subtle neon flicker
	useEffect(() => {
		let intervalId;
		if (receptionLight1.intensity > 0) {
			intervalId = setInterval(() => {
				// 25% chance to flicker
				if (Math.random() < 0.25) {
					// Turn off
					setReceptionLight1(receptionLight1.color, 0);

					// Quick flicker before turning back on
					setTimeout(() => {
						setReceptionLight1(receptionLight1.color, 0.5);
						setTimeout(() => {
							setReceptionLight1(receptionLight1.color, 0);
							setTimeout(() => {
								setReceptionLight1(receptionLight1.color, 0.7);
								setTimeout(() => {
									setReceptionLight1(receptionLight1.color, 1);
								}, 20);
							}, 20);
						}, 20);
					}, 10 + Math.random() * 50);
				}
			}, 500); // Check every half second
		}
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [receptionLight1.intensity, receptionLight1.color, setReceptionLight1]);

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
					bumpMap: roughnessMap,
					// roughnessMap,
					lightMap,
					bumpScale: 8,
					lightMapIntensity: 0,
					onBeforeCompile: (shader) => {
						shader.uniforms.uReceptionLight1Color = {
							value: new THREE.Color(
								receptionLight1.color
							).convertSRGBToLinear(),
						};
						shader.uniforms.uReceptionLight1Intensity = {
							value: receptionLight1.intensity,
						};
						shader.uniforms.uReceptionLight2Color = {
							value: new THREE.Color(
								receptionLight2.color
							).convertSRGBToLinear(),
						};
						shader.uniforms.uReceptionLight2Intensity = {
							value: receptionLight2.intensity,
						};
						shader.uniforms.uReceptionLight3Color = {
							value: new THREE.Color(
								receptionLight3.color
							).convertSRGBToLinear(),
						};
						shader.uniforms.uReceptionLight3Intensity = {
							value: receptionLight3.intensity,
						};

						material.userData.uniforms = shader.uniforms;

						shader.fragmentShader =
							`
							uniform vec3 uReceptionLight1Color;
							uniform float uReceptionLight1Intensity;
							uniform vec3 uReceptionLight2Color;
							uniform float uReceptionLight2Intensity;
							uniform vec3 uReceptionLight3Color;
							uniform float uReceptionLight3Intensity;
						` + shader.fragmentShader;

						const outgoingLightLine =
							'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;';
						shader.fragmentShader = shader.fragmentShader.replace(
							outgoingLightLine,
							`
								#ifdef USE_LIGHTMAP
									vec4 customLightMapTexel = texture2D(lightMap, vLightMapUv);
									
									float light1Intensity = customLightMapTexel.r;
									float light2Intensity = customLightMapTexel.g;
									float light3Intensity = customLightMapTexel.b;
									
									vec3 customLights = light1Intensity * uReceptionLight1Color * uReceptionLight1Intensity +
													   light2Intensity * uReceptionLight2Color * uReceptionLight2Intensity +
													   light3Intensity * uReceptionLight3Color * uReceptionLight3Intensity;
									
									vec3 outgoingLight = reflectedLight.directDiffuse + 
														reflectedLight.indirectDiffuse + 
														diffuseColor.rgb * customLights + 
														totalSpecular;
								#else
									vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
								#endif
								`
						);
					},
				});

				materialRef.current = material;
				child.material = material;
				child.castShadow = true;
				child.receiveShadow = true;
				child.material.needsUpdate = true;
			}
		});
	}, [
		scene,
		receptionLight1,
		receptionLight2,
		receptionLight3,
		bakedTexture,
		bumpMap,
		roughnessMap,
		lightMap,
	]);

	useEffect(() => {
		if (materialRef.current?.userData.uniforms) {
			const uniforms = materialRef.current.userData.uniforms;
			uniforms.uReceptionLight1Color.value = new THREE.Color(
				receptionLight1.color
			).convertSRGBToLinear();
			uniforms.uReceptionLight1Intensity.value = receptionLight1.intensity;
			uniforms.uReceptionLight2Color.value = new THREE.Color(
				receptionLight2.color
			).convertSRGBToLinear();
			uniforms.uReceptionLight2Intensity.value = receptionLight2.intensity;
			uniforms.uReceptionLight3Color.value = new THREE.Color(
				receptionLight3.color
			).convertSRGBToLinear();
			uniforms.uReceptionLight3Intensity.value = receptionLight3.intensity;
			materialRef.current.needsUpdate = true;
		}
	}, [receptionLight1, receptionLight2, receptionLight3]);

	const textMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({ color: '#8A0303' });
	}, []);

	return (
		<group rotation={[0, Math.PI / 2, 0]} position={[9.8, 0, -0.15]}>
			{/* <Receptionist /> */}
			<Metal />
			{/* <ExitSign /> */}
			<primitive object={scene} />
			<Text
				font={'/Redrum.otf'}
				position={[0, 2, 3.65]}
				material={textMaterial}
				scale={0.2}
				rotation={[0, Math.PI, 0]}
			>
				If you see or hear one of them
			</Text>
			<Text
				font={'/Redrum.otf'}
				position={[0, 1.75, 3.65]}
				material={textMaterial}
				scale={0.2}
				rotation={[0, Math.PI, 0]}
			>
				turn around
			</Text>
			{/* <pointLight intensity={100} color={'#4a7b6e'} position={[0, 2, 0]} /> */}
		</group>
	);
}

useGLTF.preload('/models/reception/reception.glb');
useTexture.preload('/textures/reception/baked_reception.webp');
useTexture.preload('/textures/reception/light_reception.webp');
useTexture.preload('/textures/reception/bump_reception.webp');
useTexture.preload('/textures/reception/roughness_reception.webp');
