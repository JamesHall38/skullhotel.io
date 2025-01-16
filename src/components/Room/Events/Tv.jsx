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
import { usePositionalSound } from '../../../utils/audio';

const PROBABILITY_OF_ACTIVATION = 20;

export default function Tv() {
	const meshRef = useRef();
	const tv = useGame((state) => state.tv);
	const setTv = useGame((state) => state.setTv);
	const setMobileClick = useGame((state) => state.setMobileClick);
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
	const mobileClick = useGame((state) => state.mobileClick);
	const processedInFrameRef = useRef(false);
	const whiteNoiseSound = usePositionalSound('whiteNoise');

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
		const cameraPosition = new THREE.Vector3();
		camera.getWorldPosition(cameraPosition);

		const meshPosition = new THREE.Vector3();
		meshRef.current.getWorldPosition(meshPosition);

		const distanceFromMesh = cameraPosition.distanceTo(meshPosition);

		if (distanceFromMesh > 2.5) return false;

		const raycaster = new THREE.Raycaster();
		const direction = new THREE.Vector3();

		direction.subVectors(meshPosition, cameraPosition).normalize();

		raycaster.set(cameraPosition, direction);

		const intersects = raycaster.intersectObject(meshRef.current);

		return intersects.length > 0;
	}, [camera]);

	useEffect(() => {
		processedInFrameRef.current = false;
	}, [mobileClick]);

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

		if (mobileClick && detected && !processedInFrameRef.current) {
			processedInFrameRef.current = true;
			setTv(!tv);
			setActiveTv(playerPositionRoom);
			setMobileClick(false);
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
			<PositionalAudio ref={tvSoundRef} {...whiteNoiseSound} loop={true} />
		</group>
	);
}
