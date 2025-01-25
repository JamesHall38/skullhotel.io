import { useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF, useKTX2, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import DetectionZone from '../DetectionZone';
import useLight from '../../hooks/useLight';
import { useControls } from 'leva';
import { usePositionalSound } from '../../utils/audio';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

const PROBABILITY_OF_DARKNESS = 20;

export default function Livingroom() {
	const { scene } = useGLTF('/models/room/livingroom.glb');
	const materialRef = useRef();

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/livingroom/baked_livingroom_etc1s.ktx2'),
			type: 'map',
		},
		{
			name: 'roughness',
			label: 'Material Properties',
			texture: useKTX2('/textures/livingroom/roughness_livingroom_etc1s.ktx2'),
			type: ['roughnessMap', 'bumpMap'],
		},
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/livingroom/light_livingroom_uastc.ktx2'),
			type: 'lightMap',
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Livingroom');

	// Create material once at component mount
	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);
				const material = new THREE.MeshStandardMaterial({
					bumpScale: 12,
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

	// Apply textures when they are loaded
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

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const lightSoundRef = useRef();

	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_DARKNESS)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_DARKNESS),
		[]
	);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
		setIsDark(false);
	}, [deaths, generateRandomRoomNumber]);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber) {
			setIsDetectionActive(true);
		} else {
			setIsDetectionActive(false);
		}
	}, [playerPositionRoom, randomRoomNumber]);

	const couchLight = useLight((state) => state.couchLight);
	const wallLight = useLight((state) => state.wallLight);
	const tvLight = useLight((state) => state.tvLight);

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

	// Add separate effect for updating uniforms
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

	useEffect(() => {
		if (isDark && lightSoundRef.current) {
			lightSoundRef.current.play();
		}
	}, [isDark]);

	useEffect(() => {
		if (isDark) {
			useLight.getState().setCouchLight('#000000', 0);
			useLight.getState().setWallLight('#000000', 0);
			useLight.getState().setTvLight('#000000', 0);
		}
	}, [isDark]);

	const isTvOn = useGame((state) => state.tv);

	useEffect(() => {
		if (!isDark) {
			if (isTvOn) {
				useLight.getState().setTvLight('#ffffff', 0.3);
			} else {
				useLight.getState().setTvLight('#000000', 0);
			}
		}
	}, [isTvOn, isDark]);

	return (
		<>
			{isDetectionActive && (
				<DetectionZone
					position={[2, 0, 2]}
					scale={[2, 2, 2]}
					onDetect={() => {
						setIsDark(true);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<primitive object={scene} />
			<PositionalAudio ref={lightSoundRef} {...usePositionalSound('bulb')} />
		</>
	);
}
