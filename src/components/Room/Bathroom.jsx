import { useEffect, useRef, useState } from 'react';
import { useGLTF, useKTX2, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import { usePositionalSound } from '../../utils/audio';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';

export default function Bathroom() {
	const { scene } = useGLTF('/models/room/bathroom.glb');
	const materialRef = useRef();
	const [lightIntensity, setLightIntensity] = useState(0);
	const timeoutRef = useRef();
	const bathroomLight = useGame((state) => state.bathroomLight);
	const materialsRef = useRef([]);

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: useKTX2('/textures/bathroom/baked_bathroom_etc1s.ktx2'),
			type: 'map',
		},
		{
			name: 'roughness',
			label: 'Material Properties',
			texture: useKTX2('/textures/bathroom/roughness_bathroom_etc1s.ktx2'),
			type: ['roughnessMap', 'bumpMap'],
		},
		{
			name: 'light',
			label: 'Lighting',
			texture: useKTX2('/textures/bathroom/light_bathroom_uastc.ktx2'),
			type: 'lightMap',
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Bathroom');

	const lightSoundRef = useRef();

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

	// Create material once at component mount
	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 12,
					lightMapIntensity: lightIntensity,
					roughness: 1,
					roughnessMap: null,
					onBeforeCompile: (shader) => {
						shader.uniforms.uRoughnessIntensity = { value: 0.75 };
						shader.uniforms.uBathroomLightIntensity = {
							value: bathroomLight ? 4 : 0,
						};

						material.userData.uniforms = shader.uniforms;

						shader.fragmentShader =
							`
							uniform float uRoughnessIntensity;
							uniform float uBathroomLightIntensity;
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
									
									float bathroomLightIntensity = customLightMapTexel.r;
									
									vec3 customLights = bathroomLightIntensity * vec3(1.0) * uBathroomLightIntensity;
									
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
				materialsRef.current.push(material);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scene]);

	// Add separate effect for updating uniforms
	useEffect(() => {
		if (materialRef.current?.userData.uniforms) {
			materialRef.current.userData.uniforms.uBathroomLightIntensity.value =
				bathroomLight ? 4 : 0;
			materialRef.current.needsUpdate = true;
		}
	}, [bathroomLight]);

	// Effet pour mettre à jour l'intensité des matériaux
	useEffect(() => {
		materialsRef.current.forEach((material) => {
			material.lightMapIntensity = lightIntensity;
			material.needsUpdate = true;
		});
	}, [lightIntensity]);

	// Effet de clignotement
	useEffect(() => {
		let intervalId;

		if (bathroomLight) {
			let intensity = 0;
			intervalId = setInterval(() => {
				intensity = Math.random() * 4;
				setLightIntensity(intensity);
			}, 50);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				clearInterval(intervalId);
				setLightIntensity(4);
			}, 1600);
		} else {
			if (intervalId) clearInterval(intervalId);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setLightIntensity(0);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [bathroomLight]);

	return (
		<group>
			<primitive object={scene} />
			<primitive
				object={scene.clone()}
				position={[-3.32, 0.0, 0]}
				scale={[-1, 1, 1]}
			/>
			<mesh
				position={[-1.65, 1.3, -3.25]}
				rotation={[0, Math.PI / 2, 0]}
				frustumCulled={false}
				renderOrder={-1}
			>
				<planeGeometry args={[2, 1]} />
				<meshPhysicalMaterial
					transparent
					polygonOffset
					opacity={0.6}
					polygonOffsetFactor={-1}
					roughness={0.1}
					metalness={1}
					color="white"
				/>
			</mesh>
			<PositionalAudio
				ref={lightSoundRef}
				{...usePositionalSound('bulb')}
				loop={false}
			/>
		</group>
	);
}

useGLTF.preload('/models/room/bathroom.glb');
