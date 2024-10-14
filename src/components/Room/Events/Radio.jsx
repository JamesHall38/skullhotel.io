import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import * as THREE from 'three';
import useInterface from '../../../hooks/useInterface';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio, useTexture } from '@react-three/drei';

const PROBABILITY_OF_ACTIVATION = 20;

const Radio = () => {
	const meshRef = useRef();
	const radio = useGame((state) => state.radio);
	const setRadio = useGame((state) => state.setRadio);
	const { camera } = useThree();
	const cursorStateRef = useRef(null);
	const prevDetectedRef = useRef(false);
	const cursor = useInterface((state) => state.cursor);
	const setCursor = useInterface((state) => state.setCursor);
	const radioSoundRef = useRef();

	const textureOn = useTexture('/textures/bedroom/radio_on.webp');
	const textureOff = useTexture('/textures/bedroom/radio_off.webp');

	// Ratio 209 x 715
	const planeWidth = 2.09;
	const planeHeight = 7.15;

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const activeRadios = useGame((state) => state.activeRadios);
	const setActiveRadio = useGame((state) => state.setActiveRadios);
	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION),
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
				setRadio(!radio);
				setActiveRadio(playerPositionRoom);
			}
		};

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [
		checkProximityAndVisibility,
		playerPositionRoom,
		setRadio,
		setActiveRadio,
		radio,
	]);

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
		setRadio(activeRadios.includes(playerPositionRoom));
	}, [playerPositionRoom, activeRadios, setRadio]);

	useEffect(() => {
		if (radio) {
			radioSoundRef.current.play();
		} else {
			radioSoundRef.current.pause();
		}
	}, [radio]);

	return (
		<group position={[4.12, 0.927, 0.295]}>
			{isDetectionActive && (
				<DetectionZone
					position={[-1, -1, 0]}
					scale={[1, 1, 1]}
					onDetect={() => {
						setRadio(true);
						setActiveRadio(playerPositionRoom);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<mesh visible={false} position={[0, 0, -0.1]} ref={meshRef}>
				<boxGeometry args={[0.2, 0.2, 0.5]} />
			</mesh>
			<mesh scale={0.05} rotation={[Math.PI / 2, -Math.PI / 2, Math.PI]}>
				<planeGeometry args={[planeWidth, planeHeight]} />
				{radio ? (
					<meshBasicMaterial map={textureOn} />
				) : (
					<meshStandardMaterial map={textureOff} />
				)}
			</mesh>
			<PositionalAudio
				ref={radioSoundRef}
				url="/sounds/radio.ogg"
				loop={true}
				distance={0.75}
				refDistance={1}
				rolloffFactor={1}
				volume={1}
			/>
		</group>
	);
};

export default Radio;
