import { useEffect, useRef } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import Metal from './Metal';
import { useControls } from 'leva';
import useLight from '../../hooks/useLight';
import useGame from '../../hooks/useGame';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

export default function Reception() {
	const performanceMode = useGame((state) => state.performanceMode);
	const { scene } = useGLTF('/models/reception/reception.glb');
	const materialRef = useRef();

	const receptionLight1 = useLight((state) => state.receptionLight1);
	const receptionLight2 = useLight((state) => state.receptionLight2);
	const receptionLight3 = useLight((state) => state.receptionLight3);

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/reception/baked_reception_etc1s.ktx2'),
			type: 'map',
		},
		// {
		// 	name: 'roughness',
		// 	label: 'Material Properties',
		// 	texture: useKTX2('/textures/reception/roughness_reception_etc1s.ktx2'),
		// 	type: ['roughnessMap', 'bumpMap'],
		// },
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/reception/light_reception_uastc.ktx2'),
			type: 'lightMap',
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Reception');

	useEffect(() => {
		if (!materialRef.current) return;

		loadedItems.forEach((item) => {
			const texture = item.texture;
			if (texture) {
				if (item.name === 'baked' || item.name === 'light') {
					texture.colorSpace = THREE.SRGBColorSpace;
				}
				texture.flipY = false;

				if (Array.isArray(item.type)) {
					item.type.forEach((type) => {
						materialRef.current[type] = texture;
					});
				} else {
					materialRef.current[item.type] = texture;
				}

				materialRef.current.castShadow = true;
				materialRef.current.receiveShadow = true;
				materialRef.current.needsUpdate = true;
			}
		});
	}, [loadedItems]);

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				// Utiliser les UV1 comme UV principal
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 12,
					lightMapIntensity: 0,
					roughness: 1,
					onBeforeCompile: (shader) => {
						shader.uniforms.uRoughnessIntensity = { value: 0.75 };
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

						materialRef.current.userData.uniforms = shader.uniforms;

						shader.fragmentShader =
							`
							uniform float uRoughnessIntensity;
							uniform vec3 uReceptionLight1Color;
							uniform float uReceptionLight1Intensity;
							uniform vec3 uReceptionLight2Color;
							uniform float uReceptionLight2Intensity;
							uniform vec3 uReceptionLight3Color;
							uniform float uReceptionLight3Intensity;
						` + shader.fragmentShader;

						shader.fragmentShader = shader.fragmentShader.replace(
							'#include <roughnessmap_fragment>',
							`
							float roughnessFactor = roughness;
							#ifdef USE_ROUGHNESSMAP
								vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
								roughnessFactor = mix(roughness, texelRoughness.g, uRoughnessIntensity);
							#endif
							`
						);

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

						// Store shader reference for updates
						material.castShadow = true;
						material.receiveShadow = true;
						material.userData.shader = shader;
					},
				});

				materialRef.current = material;
				child.material = material;
				child.castShadow = true;
				child.receiveShadow = true;
				child.needsUpdate = true;
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scene]);

	// Add new effect to update uniforms
	useEffect(() => {
		if (materialRef.current?.userData.shader) {
			const shader = materialRef.current.userData.shader;
			shader.uniforms.uReceptionLight1Color.value = new THREE.Color(
				receptionLight1.color
			).convertSRGBToLinear();
			shader.uniforms.uReceptionLight1Intensity.value =
				receptionLight1.intensity;
			shader.uniforms.uReceptionLight2Color.value = new THREE.Color(
				receptionLight2.color
			).convertSRGBToLinear();
			shader.uniforms.uReceptionLight2Intensity.value =
				receptionLight2.intensity;
			shader.uniforms.uReceptionLight3Color.value = new THREE.Color(
				receptionLight3.color
			).convertSRGBToLinear();
			shader.uniforms.uReceptionLight3Intensity.value =
				receptionLight3.intensity;
		}
	}, [receptionLight1, receptionLight2, receptionLight3]);

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

	return (
		<group rotation={[0, Math.PI / 2, 0]} position={[9.8, 0, -0.15]}>
			{/* <Receptionist /> */}
			<Metal />
			{/* <ExitSign /> */}
			<primitive object={scene} castShadow receiveShadow />
			{/* <pointLight intensity={100} color={'#4a7b6e'} position={[0, 2, 0]} /> */}
		</group>
	);
}

// useGLTF.preload('/models/reception/reception.glb');
