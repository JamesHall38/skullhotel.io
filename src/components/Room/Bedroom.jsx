import { useEffect, useRef } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import { useControls } from 'leva';
import useLight from '../../hooks/useLight';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import FloorLightMaterial from '../materials/FloorLightMaterial';
import WallsLightMaterial from '../materials/WallsLightMaterial';
import WoodLightMaterial from '../materials/WoodLightMaterial';

export default function Bedroom() {
	const { scene, nodes } = useGLTF('/models/room/bedroom.glb');
	const { nodes: skullNodes, materials: skullMaterials } = useGLTF(
		'/models/room/skull.glb'
	);
	const materialRef = useRef();
	const alternateTutorialRoom = useGame((state) => state.alternateTutorialRoom);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);

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
			texture: useKTX2('/textures/bedroom_light_uastc.ktx2'),
			type: 'lightMap',
			uvChannel: 2,
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Bedroom');

	const leftLight = useLight((state) => state.leftLight);
	const radioLight = useLight((state) => state.radioLight);
	const rightLight = useLight((state) => state.rightLight);

	useEffect(() => {
		scene.traverse((child) => {
			if (
				child.isMesh &&
				(child.name === 'bedroom' || child.name === 'skull')
			) {
				if (child.geometry.attributes['uv1']) {
					child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);
				}
				if (child.geometry.attributes['uv2']) {
					child.geometry.setAttribute('uv2', child.geometry.attributes['uv2']);
				}

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 4,
					lightMapIntensity: 0,
					roughness: 1,
					onBeforeCompile: (shader) => {
						shader.uniforms.uRoughnessIntensity = { value: 0.75 };
						shader.uniforms.uLeftLightColor = {
							value: new THREE.Color(leftLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uLeftLightIntensity = {
							value: leftLight.intensity,
						};
						shader.uniforms.uRadioLightColor = {
							value: new THREE.Color(radioLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uRadioLightIntensity = {
							value: radioLight.intensity,
						};
						shader.uniforms.uRightLightColor = {
							value: new THREE.Color(rightLight.color).convertSRGBToLinear(),
						};
						shader.uniforms.uRightLightIntensity = {
							value: rightLight.intensity,
						};

						material.userData.uniforms = shader.uniforms;

						shader.fragmentShader =
							`
							uniform float uRoughnessIntensity;
							uniform vec3 uLeftLightColor;
							uniform float uLeftLightIntensity;
							uniform vec3 uRadioLightColor;
							uniform float uRadioLightIntensity;
							uniform vec3 uRightLightColor;
							uniform float uRightLightIntensity;
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
						const index = shader.fragmentShader.indexOf(outgoingLightLine);

						if (index !== -1) {
							shader.fragmentShader = shader.fragmentShader.replace(
								outgoingLightLine,
								`
									#ifdef USE_LIGHTMAP
										vec4 customLightMapTexel = texture2D(lightMap, vLightMapUv);
										
										float leftLightIntensity = customLightMapTexel.r;
										float radioLightIntensity = customLightMapTexel.g;
										float rightLightIntensity = customLightMapTexel.b;
										
										vec3 customLights = leftLightIntensity * uLeftLightColor * uLeftLightIntensity +
																   radioLightIntensity * uRadioLightColor * uRadioLightIntensity +
																   rightLightIntensity * uRightLightColor * uRightLightIntensity;
										
										vec3 outgoingLight = reflectedLight.directDiffuse + 
																	reflectedLight.indirectDiffuse + 
																	diffuseColor.rgb * customLights + 
																	totalSpecular;
									#else
										vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
									#endif
									`
							);
						}
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
	}, [loadedItems]);

	useEffect(() => {
		if (materialRef.current?.userData.uniforms) {
			const uniforms = materialRef.current.userData.uniforms;
			uniforms.uLeftLightColor.value = new THREE.Color(
				leftLight.color
			).convertSRGBToLinear();
			uniforms.uLeftLightIntensity.value = leftLight.intensity;
			uniforms.uRadioLightColor.value = new THREE.Color(
				radioLight.color
			).convertSRGBToLinear();
			uniforms.uRadioLightIntensity.value = radioLight.intensity;
			uniforms.uRightLightColor.value = new THREE.Color(
				rightLight.color
			).convertSRGBToLinear();
			uniforms.uRightLightIntensity.value = rightLight.intensity;
			materialRef.current.needsUpdate = true;
		}
	}, [leftLight, radioLight, rightLight]);

	useControls(
		'Bedroom Lights',
		{
			leftLightColor: {
				value: leftLight.color,
				onChange: (v) =>
					useLight.getState().setLeftLight(v, leftLight.intensity),
			},
			leftLightIntensity: {
				value: leftLight.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) => useLight.getState().setLeftLight(leftLight.color, v),
			},
			radioLightColor: {
				value: radioLight.color,
				onChange: (v) =>
					useLight.getState().setRadioLight(v, radioLight.intensity),
			},
			radioLightIntensity: {
				value: radioLight.intensity,
				min: 0,
				max: 10,
				step: 0.1,
				onChange: (v) => useLight.getState().setRadioLight(radioLight.color, v),
			},
			rightLightColor: {
				value: rightLight.color,
				onChange: (v) =>
					useLight.getState().setRightLight(v, rightLight.intensity),
			},
			rightLightIntensity: {
				value: rightLight.intensity,
				min: 0,
				max: 300,
				step: 0.1,
				onChange: (v) => useLight.getState().setRightLight(rightLight.color, v),
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
				geometry={nodes.bedroom.geometry}
				material={materialRef.current}
			/>

			{alternateTutorialRoom && isTutorialOpen ? (
				<mesh
					castShadow
					receiveShadow
					geometry={skullNodes.skull.geometry}
					material={skullMaterials.bones}
					scale={0.01}
					position={[-1.5, 1.5, 0]}
				/>
			) : (
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.skull.geometry}
					material={materialRef.current}
				/>
			)}

			<WoodLightMaterial
				lightMapPath="/textures/bedroom_light_uastc.ktx2"
				geometry={nodes.BedroomWood.geometry}
				redLightColor={leftLight.color}
				redLightIntensity={leftLight.intensity}
				greenLightColor={radioLight.color}
				greenLightIntensity={radioLight.intensity}
				blueLightColor={rightLight.color}
				blueLightIntensity={rightLight.intensity}
				uvScale={20}
			/>

			<FloorLightMaterial
				lightMapPath="/textures/bedroom_light_uastc.ktx2"
				geometry={nodes.BedroomFloor.geometry}
				redLightColor={leftLight.color}
				redLightIntensity={leftLight.intensity}
				greenLightColor={radioLight.color}
				greenLightIntensity={radioLight.intensity}
				blueLightColor={rightLight.color}
				blueLightIntensity={rightLight.intensity}
			/>

			<WallsLightMaterial
				lightMapPath="/textures/bedroom_light_uastc.ktx2"
				geometry={nodes.BedRoomWalls.geometry}
				redLightColor={leftLight.color}
				redLightIntensity={leftLight.intensity}
				greenLightColor={radioLight.color}
				greenLightIntensity={radioLight.intensity}
				blueLightColor={rightLight.color}
				blueLightIntensity={rightLight.intensity}
				uvScale={10}
			/>
		</>
	);
}

useGLTF.preload('/models/room/skull.glb');
