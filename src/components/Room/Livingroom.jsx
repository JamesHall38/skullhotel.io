import { useEffect, useState, useCallback, useRef } from 'react';
import { useGLTF, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import DetectionZone from '../DetectionZone';
import useLight from '../../hooks/useLight';
import { useControls } from 'leva';

const PROBABILITY_OF_DARKNESS = 20;

export default function Livingroom() {
	const { scene } = useGLTF('/models/room/livingroom.glb');
	const bakedTexture = useTexture('/textures/livingroom/baked_livingroom.webp');
	const bumpMap = useTexture('/textures/livingroom/bump_livingroom.webp');
	const roughnessMap = useTexture(
		'/textures/livingroom/roughness_livingroom.webp'
	);
	const lightMap = useTexture('/textures/livingroom/light_livingroom.jpg');

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const materialRef = useRef();
	const lightSoundRef = useRef();

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

						material.userData.uniforms = shader.uniforms;

						shader.fragmentShader =
							`
							uniform vec3 uCouchLightColor;
							uniform float uCouchLightIntensity;
							uniform vec3 uWallLightColor;
							uniform float uWallLightIntensity;
							uniform vec3 uTvLightColor;
							uniform float uTvLightIntensity;
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
		couchLight,
		wallLight,
		tvLight,
		bakedTexture,
		bumpMap,
		roughnessMap,
		lightMap,
	]);

	useEffect(() => {
		if (materialRef.current?.userData.uniforms) {
			const uniforms = materialRef.current.userData.uniforms;
			uniforms.uCouchLightColor.value = new THREE.Color(
				couchLight.color
			).convertSRGBToLinear();
			uniforms.uCouchLightIntensity.value = couchLight.intensity;
			uniforms.uWallLightColor.value = new THREE.Color(
				wallLight.color
			).convertSRGBToLinear();
			uniforms.uWallLightIntensity.value = wallLight.intensity;
			uniforms.uTvLightColor.value = new THREE.Color(
				tvLight.color
			).convertSRGBToLinear();
			uniforms.uTvLightIntensity.value = tvLight.intensity;
			materialRef.current.needsUpdate = true;
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

useGLTF.preload('/models/room/livingroom.glb');
useTexture.preload('/textures/livingroom/baked_livingroom.webp');
useTexture.preload('/textures/livingroom/bump_livingroom.webp');
useTexture.preload('/textures/livingroom/roughness_livingroom.webp');
useTexture.preload('/textures/livingroom/light_livingroom.webp');
