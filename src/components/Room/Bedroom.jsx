import { useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import DetectionZone from '../DetectionZone';
import { useControls } from 'leva';
import useLight from '../../hooks/useLight';

const PROBABILITY_OF_DARKNESS = 20;

export default function Bedroom() {
	const { scene } = useGLTF('/models/room/bedroom.glb');
	const bakedTexture = useTexture('/textures/bedroom/baked_bedroom.webp');
	const bumpMap = useTexture('/textures/bedroom/bump_bedroom.webp');
	const roughnessMap = useTexture('/textures/bedroom/roughness_bedroom.webp');
	const lightMap = useTexture('/textures/bedroom/light_bedroom.jpg');

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const materialRef = useRef();
	const lightSoundRef = useRef();

	const { leftLight, radioLight, rightLight } = useLight();

	const isRadioOn = useGame((state) => state.radio);

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

	bakedTexture.flipY = false;
	bumpMap.flipY = false;
	roughnessMap.flipY = false;
	lightMap.flipY = false;

	bakedTexture.colorSpace = THREE.SRGBColorSpace;
	lightMap.colorSpace = THREE.SRGBColorSpace;

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

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					map: bakedTexture,
					bumpMap: roughnessMap,
					roughnessMap,
					lightMap,
					bumpScale: 8,
					lightMapIntensity: 0,
					onBeforeCompile: (shader) => {
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
							uniform vec3 uLeftLightColor;
							uniform float uLeftLightIntensity;
							uniform vec3 uRadioLightColor;
							uniform float uRadioLightIntensity;
							uniform vec3 uRightLightColor;
							uniform float uRightLightIntensity;
						` + shader.fragmentShader;

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
				child.material.needsUpdate = true;
			}
		});
	}, [
		scene,
		leftLight,
		radioLight,
		rightLight,
		bakedTexture,
		bumpMap,
		roughnessMap,
		lightMap,
	]);

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
			<PositionalAudio
				ref={lightSoundRef}
				url="/sounds/bulb.ogg"
				distance={1}
				loop={false}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</>
	);
}

useGLTF.preload('/models/room/bedroom.glb');
useTexture.preload('/textures/bedroom/baked_bedroom.webp');
useTexture.preload('/textures/bedroom/bump_bedroom.webp');
useTexture.preload('/textures/bedroom/roughness_bedroom.webp');
useTexture.preload('/textures/bedroom/light_bedroom.webp');
