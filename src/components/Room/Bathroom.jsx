import { useEffect, useRef, useState } from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import WallsMaterial from '../../components/materials/WallsMaterial';
import FloorMaterial from '../../components/materials/FloorMaterial';

function BathroomTextures({ scene, nodes, materialsRef }) {
	const wallsMaterial = WallsMaterial();
	const floorMaterial = FloorMaterial();

	useEffect(() => {
		scene.traverse((child) => {
			if (child.isMesh) {
				if (child.name === 'BathroomWalls') {
					const material = wallsMaterial();
					materialsRef.current.push(material);
					child.material = material;
				}

				if (child.name === 'BathroomFloor') {
					const material = floorMaterial();
					materialsRef.current.push(material);
					child.material = material;
				}
			}
		});
	}, [scene, wallsMaterial, floorMaterial, materialsRef]);

	if (!nodes?.BathroomWalls?.geometry || !nodes?.BathroomFloor?.geometry) {
		return null;
	}

	return (
		<>
			<mesh
				geometry={nodes.BathroomWalls.geometry}
				material={wallsMaterial()}
				castShadow
				receiveShadow
			/>
			<mesh
				geometry={nodes.BathroomFloor.geometry}
				material={floorMaterial()}
				receiveShadow
			/>
			<group position={[-3.32, 0.0, 0]} scale={[-1, 1, 1]}>
				<mesh
					geometry={nodes.BathroomWalls.geometry}
					material={wallsMaterial()}
					castShadow
					receiveShadow
				/>
				<mesh
					geometry={nodes.BathroomFloor.geometry}
					material={floorMaterial()}
					receiveShadow
				/>
			</group>
		</>
	);
}

export default function Bathroom() {
	const { scene, nodes } = useGLTF('/models/room/bathroom.glb');
	const materialRef = useRef();
	const [lightIntensity, setLightIntensity] = useState(0);
	const timeoutRef = useRef();
	const bathroomLight = useGame((state) => state.bathroomLight);
	const materialsRef = useRef([]);

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
			texture: useKTX2('/textures/bathroom_light_uastc.ktx2'),
			type: 'lightMap',
			uvChannel: 2,
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Bathroom');

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
			if (child.isMesh && child.name === 'bathroom') {
				child.geometry.setAttribute('uv', child.geometry.attributes['uv1']);
				child.geometry.setAttribute('uv2', child.geometry.attributes['uv2']);

				const material = new THREE.MeshStandardMaterial({
					bumpScale: 4,
					lightMapIntensity: lightIntensity,
					roughness: 1,
					roughnessMap: null,
					onBeforeCompile: (shader) => {
						shader.uniforms.uRoughnessIntensity = { value: 0.75 };
						shader.uniforms.uBathroomLightIntensity = {
							value: 0,
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

	useEffect(() => {
		if (materialRef.current?.userData.uniforms) {
			materialRef.current.userData.uniforms.uBathroomLightIntensity.value =
				lightIntensity * 2;
			materialRef.current.needsUpdate = true;
		}
	}, [lightIntensity]);

	useEffect(() => {
		materialsRef.current.forEach((material) => {
			material.lightMapIntensity = lightIntensity;
			material.needsUpdate = true;
		});
	}, [lightIntensity]);

	useEffect(() => {
		let intervalId;

		if (bathroomLight) {
			let intensity = 0;
			intervalId = setInterval(() => {
				intensity = Math.random();
				setLightIntensity(intensity);
			}, 50);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				clearInterval(intervalId);
				setLightIntensity(1);
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
			<group>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.bathroom.geometry}
					material={materialRef.current}
				/>
			</group>

			<group position={[-3.32, 0.0, 0]} scale={[-1, 1, 1]}>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.bathroom.geometry}
					material={materialRef.current}
				/>
			</group>

			{/* wall inside the mirror */}
			<mesh
				position={[-8, 1, -2.65]}
				rotation={[0, Math.PI / 2, 0]}
				receiveShadow
			>
				<planeGeometry args={[2, 4]} />
				<meshStandardMaterial color="lightgray" />
			</mesh>

			{/* mirror */}
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

			<BathroomTextures
				scene={scene}
				nodes={nodes}
				materialsRef={materialsRef}
			/>
		</group>
	);
}

useGLTF.preload('/models/room/bathroom.glb');
