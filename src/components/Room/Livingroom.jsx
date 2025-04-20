import { useEffect, useRef } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useLight from '../../hooks/useLight';
import { useControls } from 'leva';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import FloorLightMaterial from '../materials/FloorLightMaterial';
import WallsLightMaterial from '../materials/WallsLightMaterial';
import WoodLightMaterial from '../materials/WoodLightMaterial';

export default function Livingroom() {
	const { scene, nodes } = useGLTF('/models/room/livingroom.glb');
	const performanceMode = useGame((state) => state.performanceMode);
	const materialRef = useRef();

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/baked_color_etc1s.ktx2'),
			type: 'map',
			uvChannel: 0,
		},
		{
			name: 'roughness',
			label: 'Material Properties',
			texture: useKTX2('/textures/baked_roughness_etc1s.ktx2'),
			type: ['roughnessMap', 'bumpMap'],
			uvChannel: 0,
		},
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/livingroom_light_uastc.ktx2'),
			type: 'lightMap',
			uvChannel: 2,
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Livingroom');

	const couchLight = useLight((state) => state.couchLight);
	const wallLight = useLight((state) => state.wallLight);
	const tvLight = useLight((state) => state.tvLight);

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh && child.name === 'livingroom') {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);
				child.geometry.setAttribute('uv2', child.geometry.attributes['uv2']);

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 4,
					lightMapIntensity: 0,
					roughness: 1,
					onBeforeCompile: (shader) => {
						shader.uniforms.uRoughnessIntensity = { value: 0.75 };
						shader.uniforms.uCouchLightColor = {
							value: new THREE.Color(couchLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uCouchLightIntensity = {
							value: couchLight.intensity,
						};
						shader.uniforms.uWallLightColor = {
							value: new THREE.Color(wallLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uWallLightIntensity = {
							value: wallLight.intensity,
						};
						shader.uniforms.uTvLightColor = {
							value: new THREE.Color(tvLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uTvLightIntensity = {
							value: tvLight.intensity,
						};

						material.userData.shader = shader;

						shader.fragmentShader =
							`
							uniform float uRoughnessIntensity;
							uniform vec3 uCouchLightColor;
							uniform float uCouchLightIntensity;
							uniform vec3 uWallLightColor;
							uniform float uWallLightIntensity;
							uniform vec3 uTvLightColor;
							uniform float uTvLightIntensity;
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
								
								float couchLightIntensity = customLightMapTexel.r;
								float wallLightIntensity = customLightMapTexel.b;
								float tvLightIntensity = customLightMapTexel.g;
								
								vec3 customLights = couchLightIntensity * uCouchLightColor * uCouchLightIntensity +
												  wallLightIntensity * uWallLightColor * uWallLightIntensity +
												  tvLightIntensity * uTvLightColor * uTvLightIntensity;
								
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
				child.needsUpdate = true;
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scene]);

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
	}, [loadedItems, performanceMode]);

	useEffect(() => {
		if (materialRef.current?.userData.shader) {
			const shader = materialRef.current.userData.shader;
			shader.uniforms.uCouchLightColor.value = new THREE.Color(
				couchLight.color
			).convertSRGBToLinear();
			shader.uniforms.uCouchLightIntensity.value = couchLight.intensity;
			shader.uniforms.uWallLightColor.value = new THREE.Color(
				wallLight.color
			).convertSRGBToLinear();
			shader.uniforms.uWallLightIntensity.value = wallLight.intensity;
			shader.uniforms.uTvLightColor.value = new THREE.Color(
				tvLight.color
			).convertSRGBToLinear();
			shader.uniforms.uTvLightIntensity.value = tvLight.intensity;
		}
	}, [couchLight, wallLight, tvLight]);

	useControls(
		'Livingroom Lights',
		{
			couchLightColor: {
				value: couchLight.color,
				onChange: (v) =>
					useLight.getState().setCouchLight(v, couchLight.intensity),
			},
			couchLightIntensity: {
				value: couchLight.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) => useLight.getState().setCouchLight(couchLight.color, v),
			},
			wallLightColor: {
				value: wallLight.color,
				onChange: (v) =>
					useLight.getState().setWallLight(v, wallLight.intensity),
			},
			wallLightIntensity: {
				value: wallLight.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) => useLight.getState().setWallLight(wallLight.color, v),
			},
			tvLightColor: {
				value: tvLight.color,
				onChange: (v) => useLight.getState().setTvLight(v, tvLight.intensity),
			},
			tvLightIntensity: {
				value: tvLight.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) => useLight.getState().setTvLight(tvLight.color, v),
			},
		},
		{
			collapsed: true,
		}
	);

	return (
		<>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.livingroom.geometry}
				material={materialRef.current}
			/>

			<WoodLightMaterial
				lightMapPath="/textures/livingroom_light_uastc.ktx2"
				geometry={nodes.LivingroomWood.geometry}
				redLightColor={couchLight.color}
				redLightIntensity={couchLight.intensity}
				greenLightColor={tvLight.color}
				greenLightIntensity={tvLight.intensity}
				blueLightColor={wallLight.color}
				blueLightIntensity={wallLight.intensity}
				uvScale={10}
			/>

			<FloorLightMaterial
				lightMapPath="/textures/livingroom_light_uastc.ktx2"
				geometry={nodes.LivingroomFloor.geometry}
				redLightColor={couchLight.color}
				redLightIntensity={couchLight.intensity}
				greenLightColor={tvLight.color}
				greenLightIntensity={tvLight.intensity}
				blueLightColor={wallLight.color}
				blueLightIntensity={wallLight.intensity}
			/>

			<WallsLightMaterial
				lightMapPath="/textures/livingroom_light_uastc.ktx2"
				geometry={nodes.LivingroomWalls.geometry}
				redLightColor={couchLight.color}
				redLightIntensity={couchLight.intensity}
				greenLightColor={tvLight.color}
				greenLightIntensity={tvLight.intensity}
				blueLightColor={wallLight.color}
				blueLightIntensity={wallLight.intensity}
				uvScale={10}
			/>
		</>
	);
}
