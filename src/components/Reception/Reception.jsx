import { useEffect, useRef, useState } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import Metal from './Metal';
import { useControls } from 'leva';
import useLight from '../../hooks/useLight';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import { useFrame } from '@react-three/fiber';
import WoodLightMaterial from '../materials/WoodLightMaterial';
import WallsLightMaterial from '../materials/WallsLightMaterial';
import CarpetLightMaterial from '../materials/CarpetLightMaterial';

export default function Reception(props) {
	const { scene, nodes } = useGLTF('/models/reception/reception.glb');
	const performanceMode = useGame((state) => state.performanceMode);
	const materialRef = useRef();
	const [isVisible, setIsVisible] = useState(true);

	const receptionLight1 = useLight((state) => state.receptionLight1);
	const receptionLight2 = useLight((state) => state.receptionLight2);
	const receptionLight3 = useLight((state) => state.receptionLight3);

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/reception/reception_color_etc1s.ktx2'),
			type: 'map',
			uvChannel: 0,
		},
		{
			name: 'roughness',
			label: 'Material Properties',
			texture: useKTX2('/textures/reception/reception_roughness_etc1s.ktx2'),
			type: ['roughnessMap', 'bumpMap'],
			uvChannel: 0,
		},
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/reception/reception_light_uastc.ktx2'),
			type: 'lightMap',
			uvChannel: 2,
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Reception');

	useFrame(({ camera }) => {
		const isInRoom = Math.abs(camera.position.z) > 1;
		const isInTutorial =
			(camera.position.x > 1 && camera.position.z > -1) ||
			camera.position.x > 7;
		setIsVisible(isInTutorial ? true : !isInRoom);
	});

	useEffect(() => {
		if (!materialRef.current) return;

		loadedItems.forEach((item) => {
			const texture = item.texture;
			if (texture) {
				if (item.name === 'baked' || item.name === 'light') {
					texture.colorSpace = THREE.SRGBColorSpace;
				}
				texture.flipY = false;
				texture.channel = item.uvChannel;

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
				child.geometry.setAttribute('uv2', child.geometry.attributes['uv2']);

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 8,
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

	useEffect(() => {
		if (performanceMode) {
			materialRef.current.needsUpdate = true;
		}
	}, [performanceMode]);

	return (
		<group
			rotation={[0, Math.PI / 2, 0]}
			position={[9.8, 0, -0.15]}
			visible={isVisible}
			{...props}
			dispose={null}
		>
			<Metal />
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.baked.geometry}
				material={materialRef.current}
			/>

			<WoodLightMaterial
				lightMapPath="/textures/reception/reception_light_uastc.ktx2"
				geometry={nodes.ReceptionWood.geometry}
				redLightColor={receptionLight1.color}
				redLightIntensity={receptionLight1.intensity}
				greenLightColor={receptionLight2.color}
				greenLightIntensity={receptionLight2.intensity}
				blueLightColor={receptionLight3.color}
				blueLightIntensity={receptionLight3.intensity}
				uvScale={10}
			/>

			<CarpetLightMaterial
				lightMapPath="/textures/reception/reception_light_uastc.ktx2"
				geometry={nodes.ReceptionFloor.geometry}
				redLightColor={receptionLight1.color}
				redLightIntensity={receptionLight1.intensity}
				greenLightColor={receptionLight2.color}
				greenLightIntensity={receptionLight2.intensity}
				blueLightColor={receptionLight3.color}
				blueLightIntensity={receptionLight3.intensity}
				uvScale={35}
			/>

			<WallsLightMaterial
				lightMapPath="/textures/reception/reception_light_uastc.ktx2"
				geometry={nodes.ReceptionWalls.geometry}
				redLightColor={receptionLight1.color}
				redLightIntensity={receptionLight1.intensity}
				greenLightColor={receptionLight2.color}
				greenLightIntensity={receptionLight2.intensity}
				blueLightColor={receptionLight3.color}
				blueLightIntensity={receptionLight3.intensity}
				uvScale={10}
			/>
		</group>
	);
}

useGLTF.preload('/models/reception/reception.glb');
