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
	const [isDetected, setIsDetected] = useState(false);
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

	useEffect(() => {
		const handleClick = () => {
			if (isDetected) {
				setTv(!tv);
				setActiveTv(playerPositionRoom);
			}
		};

		document.addEventListener('click', handleClick);
		return () => {
			document.removeEventListener('click', handleClick);
		};
	}, [isDetected]);

	return (
		<group position={[-1.285, 0.9, 3.65]}>
			<DetectionZone
				position={[0.1, 0, -0.1]}
				scale={[0.2, 1, 1.5]}
				onDetect={() => {
					setCursor('power-tv');
					setIsDetected(true);
				}}
				onDetectEnd={() => {
					setCursor(null);
					setIsDetected(false);
				}}
				downward={true}
				name="tv"
				type="power"
			/>
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
