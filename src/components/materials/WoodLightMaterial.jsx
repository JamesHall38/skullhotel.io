import React from 'react';
import { useEffect, useRef } from 'react';
import { useKTX2 } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import * as THREE from 'three';

export default function WoodLightMaterial({
	lightMapPath = null,
	geometry,
	redLightColor,
	redLightIntensity,
	greenLightColor,
	greenLightIntensity,
	blueLightColor,
	blueLightIntensity,
	uvScale = 1,
}) {
	const materialRef = useRef();
	const performanceMode = useGame((state) => state.performanceMode);

	const colorTexture = useKTX2('/textures/wood/wood_color_etc1s.ktx2');
	const roughnessTexture = useKTX2('/textures/wood/wood_roughness_etc1s.ktx2');
	const lightTexture = useKTX2(lightMapPath || '');

	useEffect(() => {
		geometry.setAttribute('uv', geometry.attributes['uv1']);
		geometry.setAttribute('uv2', geometry.attributes['uv2']);

		const uvs = geometry.attributes.uv1.array;
		for (let i = 0; i < uvs.length; i++) {
			uvs[i] *= uvScale;
		}
		geometry.attributes.uv1.needsUpdate = true;

		const material = new THREE.MeshStandardMaterial({
			lightMapIntensity: 0,
			roughness: 1,
			bumpMap: roughnessTexture,
			bumpScale: 2,
			onBeforeCompile: (shader) => {
				shader.uniforms.uRoughnessIntensity = { value: 0.75 };
				shader.uniforms.uRedLightColor = {
					value: new THREE.Color(redLightColor).convertSRGBToLinear(),
				};
				shader.uniforms.uRedLightIntensity = {
					value: redLightIntensity,
				};
				shader.uniforms.uBlueLightColor = {
					value: new THREE.Color(blueLightColor).convertSRGBToLinear(),
				};
				shader.uniforms.uBlueLightIntensity = {
					value: blueLightIntensity,
				};
				shader.uniforms.uGreenLightColor = {
					value: new THREE.Color(greenLightColor).convertSRGBToLinear(),
				};
				shader.uniforms.uGreenLightIntensity = {
					value: greenLightIntensity,
				};

				material.userData.shader = shader;

				shader.fragmentShader =
					`
							uniform float uRoughnessIntensity;
							uniform vec3 uRedLightColor;
							uniform float uRedLightIntensity;
							uniform vec3 uBlueLightColor;
							uniform float uBlueLightIntensity;
							uniform vec3 uGreenLightColor;
							uniform float uGreenLightIntensity;
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
								
								float redLightIntensity = customLightMapTexel.r;
								float blueLightIntensity = customLightMapTexel.b;
								float greenLightIntensity = customLightMapTexel.g;
								
								vec3 customLights = redLightIntensity * uRedLightColor * uRedLightIntensity +
												  blueLightIntensity * uBlueLightColor * uBlueLightIntensity +
												  greenLightIntensity * uGreenLightColor * uGreenLightIntensity;
								
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
		geometry.material = material;
		geometry.castShadow = true;
		geometry.receiveShadow = true;
		geometry.needsUpdate = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [geometry, uvScale]);

	useEffect(() => {
		if (!materialRef.current || !materialRef.current.userData?.shader?.uniforms)
			return;

		const { uniforms } = materialRef.current.userData.shader;

		if (uniforms.uRedLightColor) {
			uniforms.uRedLightColor.value = new THREE.Color(
				redLightColor
			).convertSRGBToLinear();
		}
		if (uniforms.uRedLightIntensity) {
			uniforms.uRedLightIntensity.value = redLightIntensity;
		}
		if (uniforms.uGreenLightColor) {
			uniforms.uGreenLightColor.value = new THREE.Color(
				greenLightColor
			).convertSRGBToLinear();
		}
		if (uniforms.uGreenLightIntensity) {
			uniforms.uGreenLightIntensity.value = greenLightIntensity;
		}
		if (uniforms.uBlueLightColor) {
			uniforms.uBlueLightColor.value = new THREE.Color(
				blueLightColor
			).convertSRGBToLinear();
		}
		if (uniforms.uBlueLightIntensity) {
			uniforms.uBlueLightIntensity.value = blueLightIntensity;
		}
	}, [
		redLightColor,
		redLightIntensity,
		blueLightColor,
		blueLightIntensity,
		greenLightColor,
		greenLightIntensity,
	]);

	useEffect(() => {
		if (!materialRef.current) return;

		if (colorTexture) {
			colorTexture.channel = 0;
			colorTexture.colorSpace = THREE.SRGBColorSpace;
			colorTexture.wrapS = THREE.RepeatWrapping;
			colorTexture.wrapT = THREE.RepeatWrapping;
			colorTexture.needsUpdate = true;
			colorTexture.flipY = false;
			materialRef.current.map = colorTexture;
		}

		if (roughnessTexture) {
			roughnessTexture.channel = 0;
			roughnessTexture.wrapS = THREE.RepeatWrapping;
			roughnessTexture.wrapT = THREE.RepeatWrapping;
			roughnessTexture.needsUpdate = true;
			roughnessTexture.flipY = false;
			materialRef.current.roughnessMap = roughnessTexture;
		}

		if (lightTexture) {
			lightTexture.channel = 2;
			lightTexture.colorSpace = THREE.SRGBColorSpace;
			lightTexture.wrapS = THREE.RepeatWrapping;
			lightTexture.wrapT = THREE.RepeatWrapping;
			lightTexture.needsUpdate = true;
			lightTexture.flipY = false;
			materialRef.current.lightMap = lightTexture;
		}

		materialRef.current.needsUpdate = true;
	}, [colorTexture, roughnessTexture, lightTexture]);

	useEffect(() => {
		if (performanceMode) {
			geometry.needsUpdate = true;
			materialRef.current.needsUpdate = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [performanceMode]);

	return (
		<mesh
			castShadow
			receiveShadow
			geometry={geometry}
			material={materialRef.current}
		/>
	);
}
