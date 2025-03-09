import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useGamepadControls from '../../../hooks/useGamepadControls';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio, Text } from '@react-three/drei';
import { usePositionalSound } from '../../../utils/audio';
import * as THREE from 'three';

export default function Tv() {
	const meshRef = useRef();
	const [isDetected, setIsDetected] = useState(false);
	const tv = useGame((state) => state.tv);
	const setTv = useGame((state) => state.setTv);
	const setCursor = useInterface((state) => state.setCursor);
	const tvSoundRef = useRef();
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const activeTvs = useGame((state) => state.activeTvs);
	const setActiveTv = useGame((state) => state.setActiveTvs);
	const whiteNoiseSound = usePositionalSound('whiteNoise');
	const mobileClick = useGame((state) => state.mobileClick);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const gamepadControls = useGamepadControls();
	const prevXButtonRef = useRef(false);
	const activeRaids = useGame((state) => state.activeRaids);
	const [showHide, setShowHide] = useState(false);
	const knockedRooms = useGame((state) => state.knockedRooms);

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
		}),
		[]
	);

	const redTextMaterial = useMemo(() => {
		return new THREE.MeshBasicMaterial({ color: '#000' });
	}, []);

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
		setTv(activeTvs.includes(playerPositionRoom));
	}, [playerPositionRoom, activeTvs, setTv]);

	useEffect(() => {
		if (tv && activeRaids.includes(playerPositionRoom)) {
			setShowHide(true);
		} else {
			setShowHide(false);
		}
	}, [tv, activeRaids, playerPositionRoom]);

	useFrame(() => {
		const xButtonPressed = gamepadControls().action;
		if (isDetected && xButtonPressed && !prevXButtonRef.current) {
			const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
			setTv(!tv);
			setActiveTv(playerPositionRoom);
		}
		prevXButtonRef.current = xButtonPressed;
	});

	useEffect(() => {
		if (isDetected && mobileClick) {
			const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
			setTv(!tv);
			setActiveTv(playerPositionRoom);
			setMobileClick(false);
		}
	}, [
		isDetected,
		mobileClick,
		playerPositionRoom,
		setActiveTv,
		setMobileClick,
		setTv,
		tv,
		knockedRooms,
	]);

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
				onPointerDown={(e) => {
					if (e.button === 0) {
						const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
						setTv(!tv);
						setActiveTv(playerPositionRoom);
					}
				}}
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
			{showHide && (
				<group scale={0.1} position={[0.01, 0, 0]}>
					<Text
						font={'/Redrum.otf'}
						rotation={[0, Math.PI / 2, 0]}
						material={redTextMaterial}
						scale={2}
					>
						HIDE
					</Text>
				</group>
			)}
			<PositionalAudio ref={tvSoundRef} {...whiteNoiseSound} loop={true} />
		</group>
	);
}
