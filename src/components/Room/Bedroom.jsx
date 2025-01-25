import { useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF, useKTX2, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import DetectionZone from '../DetectionZone';
import { useControls } from 'leva';
import useLight from '../../hooks/useLight';
import { usePositionalSound } from '../../utils/audio';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

const PROBABILITY_OF_DARKNESS = 20;

export default function Bedroom() {
	const { scene } = useGLTF('/models/room/bedroom.glb');
	const materialRef = useRef();

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/bedroom/baked_bedroom_etc1s.ktx2'),
			type: 'map',
		},
		{
			name: 'roughness',
			label: 'Material Properties',
			texture: useKTX2('/textures/bedroom/roughness_bedroom_etc1s.ktx2'),
			type: ['roughnessMap', 'bumpMap'],
		},
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/bedroom/light_bedroom_uastc.ktx2'),
			type: 'lightMap',
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Bedroom');

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const lightSoundRef = useRef();

	const { leftLight, radioLight, rightLight } = useLight();

	const isRadioOn = useGame((state) => state.radio);

	const bulbSound = usePositionalSound('bulb');

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

	// Add separate effect for updating uniforms
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

	useEffect(() => {
		if (isDark && lightSoundRef.current) {
			lightSoundRef.current.play();
		}
	}, [isDark]);

	useEffect(() => {
		if (!isDark) {
			if (isRadioOn) {
				useLight.getState().setRadioLight('#fff0be', 0.1);
			} else {
				useLight.getState().setRadioLight('#000000', 0);
			}
		}
	}, [isRadioOn, isDark]);

	return (
		<>
			{isDetectionActive && (
				<DetectionZone
					position={[2, 0, 0]}
					scale={[2, 2, 2]}
					onDetect={() => {
						setIsDark(true);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<primitive object={scene} />
			<PositionalAudio ref={lightSoundRef} {...bulbSound} loop={false} />
		</>
	);
}
