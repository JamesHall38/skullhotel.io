import React, {
	useRef,
	useMemo,
	useEffect,
	useCallback,
	useState,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import * as THREE from 'three';
import useInterface from '../../../hooks/useInterface';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio } from '@react-three/drei';

const PROBABILITY_OF_ACTIVATION = 20;

export default function Tv() {
	const meshRef = useRef();
	const tv = useGame((state) => state.tv);
	const setTv = useGame((state) => state.setTv);
	const { camera } = useThree();
	const cursorStateRef = useRef(null);
	const prevDetectedRef = useRef(false);
	const cursor = useInterface((state) => state.cursor);
	const setCursor = useInterface((state) => state.setCursor);
	const tvSoundRef = useRef();
	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const activeTvs = useGame((state) => state.activeTvs);
	const setActiveTv = useGame((state) => state.setActiveTvs);
	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION),
		[]
	);

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
		}),
		[]
	);

	const checkProximityAndVisibility = useCallback(() => {
		if (!meshRef.current) return false;

		const cameraPosition = new THREE.Vector3();
		camera.getWorldPosition(cameraPosition);

		const meshPosition = new THREE.Vector3();
		meshRef.current.getWorldPosition(meshPosition);

		const distanceFromMesh = cameraPosition.distanceTo(meshPosition);

		if (distanceFromMesh > 2.5) return false;

		const raycaster = new THREE.Raycaster();
		const cameraDirection = new THREE.Vector3();
		camera.getWorldDirection(cameraDirection);

		raycaster.set(cameraPosition, cameraDirection);

		const intersects = raycaster.intersectObject(meshRef.current);

		return intersects.length > 0;
	}, [camera]);

	useFrame(() => {
		const detected = checkProximityAndVisibility();
		if (detected !== prevDetectedRef.current) {
			prevDetectedRef.current = detected;
			const newCursorState = detected
				? 'power'
				: cursor !== 'power'
				? cursor
				: null;

			if (cursorStateRef.current !== newCursorState) {
				cursorStateRef.current = newCursorState;
				setCursor(newCursorState);
			}
		}
	});

	useEffect(() => {
		const handleDocumentClick = () => {
			if (checkProximityAndVisibility()) {
				setTv(!tv);
				setActiveTv(playerPositionRoom);
			}
		};

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [checkProximityAndVisibility, playerPositionRoom, setTv, setActiveTv, tv]);

	useFrame((state) => {
		const { clock } = state;
		if (meshRef.current) {
			meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
		}
	});

	useEffect(() => {
		if (tv) {
			tvSoundRef.current.play();
		} else {
			tvSoundRef.current.pause();
		}
	}, [tv]);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
	}, [deaths, generateRandomRoomNumber]);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber) {
			setIsDetectionActive(true);
		} else {
			setIsDetectionActive(false);
		}
	}, [playerPositionRoom, randomRoomNumber]);

	useEffect(() => {
		setTv(activeTvs.includes(playerPositionRoom));
	}, [playerPositionRoom, activeTvs, setTv]);

	return (
		<group position={[-1.285, 0.9, 3.65]}>
			{isDetectionActive && (
				<DetectionZone
					position={[3, -1, 0]}
					scale={[2, 1, 2]}
					onDetect={() => {
						setTv(true);
						setActiveTv(playerPositionRoom);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<mesh
				visible={tv}
				scale={0.087}
				rotation={[0, Math.PI / 2, 0]}
				ref={meshRef}
			>
				<planeGeometry args={[16, 9]} />
				<shaderMaterial
					uniforms={uniforms}
					vertexShader={`
					varying vec2 vUv;
					void main() {
						vUv = uv;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`}
					fragmentShader={`
					uniform float uTime;
					varying vec2 vUv;
					
					float random(vec2 st) {
						return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
					}
					
					void main() {
						vec2 st = vUv;
						float noise = random(st + uTime);
						
						gl_FragColor = vec4(vec3(noise), 1.0);
					}
				`}
				/>
			</mesh>
			<PositionalAudio
				ref={tvSoundRef}
				url="/sounds/white_noise.ogg"
				loop={true}
				distance={0.75}
				refDistance={1}
				rolloffFactor={1}
				volume={1}
			/>
		</group>
	);
}
