import { useEffect, useRef, useState } from 'react';
import { useGLTF, useKTX2, Text, Svg } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import Metal from './Metal';
import { useControls } from 'leva';
import { useFrame } from '@react-three/fiber';
import useLight from '../../hooks/useLight';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import WoodLightMaterial from '../materials/WoodLightMaterial';
import WallsLightMaterial from '../materials/WallsLightMaterial';
import CarpetLightMaterial from '../materials/CarpetLightMaterial';
import useInterface from '../../hooks/useInterface';
import useLocalization from '../../hooks/useLocalization';
import './Reception.css';

export default function Reception(props) {
	const { scene, nodes } = useGLTF('/models/reception/reception.glb');
	const performanceMode = useGame((state) => state.performanceMode);
	const materialRef = useRef();
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);
	const [isVisible, setIsVisible] = useState(true);
	const [showGuestBook, setShowGuestBook] = useState(false);
	const [showHowItsMade, setShowHowItsMade] = useState(false);
	const { t } = useLocalization();

	const guestBookBoxRef = useRef();
	const howItsMadeBoxRef = useRef();
	const guestBookArrowRef = useRef();
	const howItsMadeArrowRef = useRef();
	const guestBookGroupRef = useRef();
	const howItsMadeGroupRef = useRef();

	const cursor = useInterface((state) => state.cursor);
	const setCursor = useInterface((state) => state.setCursor);

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

	useFrame((state) => {
		const time = state.clock.elapsedTime;
		const { camera } = state;

		if (guestBookArrowRef.current) {
			guestBookArrowRef.current.position.y = 1.2 + Math.sin(time * 2) * 0.05;
		}
		if (howItsMadeArrowRef.current) {
			howItsMadeArrowRef.current.position.y = 1.2 + Math.sin(time * 2) * 0.05;
		}

		// Update group rotations to face camera
		if (guestBookGroupRef.current) {
			const direction = new THREE.Vector3();
			camera.getWorldDirection(direction);
			const angle = Math.atan2(direction.x, direction.z);
			guestBookGroupRef.current.rotation.y = angle + Math.PI / 2;
		}
		if (guestBookArrowRef.current) {
			const direction = new THREE.Vector3();
			camera.getWorldDirection(direction);
			const angle = Math.atan2(direction.x, direction.z);
			guestBookArrowRef.current.rotation.y = angle + Math.PI / 2;
		}
		if (howItsMadeGroupRef.current) {
			const direction = new THREE.Vector3();
			camera.getWorldDirection(direction);
			const angle = Math.atan2(direction.x, direction.z);
			howItsMadeGroupRef.current.rotation.y = angle + Math.PI / 2;
		}
		if (howItsMadeArrowRef.current) {
			const direction = new THREE.Vector3();
			camera.getWorldDirection(direction);
			const angle = Math.atan2(direction.x, direction.z);
			howItsMadeArrowRef.current.rotation.y = angle + Math.PI / 2;
		}

		const isInRoom = Math.abs(camera.position.z) > 1;
		const isInTutorial =
			(camera.position.x > 1 && camera.position.z > -1) ||
			camera.position.x > 7;
		setIsVisible(isInTutorial ? true : !isInRoom);

		if (camera.position.z > 2.3 && camera.position.x > 8 && !isAnyPopupOpen) {
			const raycaster = new THREE.Raycaster();
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);
			raycaster.set(camera.position, cameraDirection);

			const guestBookIntersects = guestBookBoxRef.current
				? raycaster.intersectObject(guestBookBoxRef.current)
				: [];
			const howItsMadeIntersects = howItsMadeBoxRef.current
				? raycaster.intersectObject(howItsMadeBoxRef.current)
				: [];

			if (guestBookIntersects.length > 0) {
				setShowGuestBook(true);
				if (cursor !== 'book') {
					setCursor('book');
				}
			} else if (howItsMadeIntersects.length > 0) {
				setShowHowItsMade(true);
				if (cursor !== 'help') {
					setCursor('help');
				}
			} else {
				if (cursor === 'book' || cursor === 'help') {
					setCursor(null);
				}
				setShowGuestBook(false);
				setShowHowItsMade(false);
			}
		} else {
			if (cursor === 'book' || cursor === 'help') {
				setCursor(null);
			}
			setShowGuestBook(false);
			setShowHowItsMade(false);
		}
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

			{/* Detection boxes */}
			<mesh ref={guestBookBoxRef} position={[-2, 1.25, 0.25]} scale={0.5}>
				<boxGeometry args={[1, 3, 1]} />
				<meshBasicMaterial color="red" visible={false} />
			</mesh>

			<mesh ref={howItsMadeBoxRef} position={[-2, 1.25, 1.95]} scale={0.5}>
				<boxGeometry args={[1, 3, 1]} />
				<meshBasicMaterial color="blue" visible={false} />
			</mesh>

			{showGuestBook && (
				<group>
					<Text
						ref={guestBookGroupRef}
						font={'/Futura.ttf'}
						position={[-2, 1.4, 0.25]}
						scale={0.1}
					>
						{t('ui.reception.guestBook')}
					</Text>
					<Svg
						ref={guestBookArrowRef}
						src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z"/></svg>`}
						position={[-2, 1.2, 0.185]}
						scale={0.002}
					/>
				</group>
			)}

			{showHowItsMade && (
				<group>
					<Text
						ref={howItsMadeGroupRef}
						font={'/Futura.ttf'}
						position={[-2, 1.4, 1.95]}
						scale={0.1}
					>
						{t('ui.reception.informations')}
					</Text>
					<Svg
						ref={howItsMadeArrowRef}
						src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z"/></svg>`}
						position={[-2, 1.2, 1.9]}
						scale={0.002}
					/>
				</group>
			)}
		</group>
	);
}

useGLTF.preload('/models/reception/reception.glb');
