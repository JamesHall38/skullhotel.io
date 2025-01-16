import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
} from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import DetectionZone from '../../DetectionZone';
import * as THREE from 'three';
import useGame from '../../../hooks/useGame';
import { usePositionalSound } from '../../../utils/audio';

const PROBABILITY_OF_FALLING = 20;
const LERP_SPEED = 20;
const SOUND_TRIGGER_THRESHOLD = 0.5;

export default function Painting(props) {
	const { nodes, materials } = useGLTF('/models/room/painting.glb');
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const [isFalling, setIsFalling] = useState(false);
	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const hasPlayed = useRef(false);
	const groupRef = useRef();
	const soundRef = useRef();
	const impactSound = usePositionalSound('impact');

	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_FALLING)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_FALLING),
		[]
	);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
	}, [deaths, generateRandomRoomNumber]);

	const targetRotation = useMemo(() => new THREE.Euler(-0.17, 0, 0), []);
	const targetPosition = useMemo(() => new THREE.Vector3(0, -0.19, 0.2), []);
	const initialRotation = useMemo(() => new THREE.Euler(0, 0, 0), []);
	const initialPosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber.current) {
			setIsDetectionActive(true);
			if (hasPlayed.current) {
				if (groupRef.current) {
					groupRef.current.rotation.copy(targetRotation);
					groupRef.current.position.copy(targetPosition);
				}
			} else {
				if (isFalling) {
					setIsFalling(true);
				}
			}
		} else {
			setIsDetectionActive(false);
			setIsFalling(false);
			if (groupRef.current) {
				groupRef.current.rotation.copy(initialRotation);
				groupRef.current.position.copy(initialPosition);
			}
		}
	}, [
		playerPositionRoom,
		isFalling,
		initialRotation,
		initialPosition,
		targetRotation,
		targetPosition,
		randomRoomNumber,
	]);

	useFrame((_, delta) => {
		if (isFalling && groupRef.current) {
			const { current: painting } = groupRef;

			const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta);

			painting.rotation.x = THREE.MathUtils.lerp(
				painting.rotation.x,
				targetRotation.x,
				lerpFactor
			);

			painting.position.lerp(targetPosition, lerpFactor);

			const rotationProgress =
				1 -
				Math.abs(painting.rotation.x - targetRotation.x) /
					Math.abs(targetRotation.x);
			const positionProgress =
				1 -
				painting.position.distanceTo(targetPosition) / targetPosition.length();

			const isCloseToTarget =
				rotationProgress > 1 - SOUND_TRIGGER_THRESHOLD &&
				positionProgress > 1 - SOUND_TRIGGER_THRESHOLD;

			if (!hasPlayed.current && isCloseToTarget) {
				soundRef.current.play();
				hasPlayed.current = true;
			}
		}
	});

	return (
		<group {...props} dispose={null}>
			{isDetectionActive && (
				<DetectionZone
					position={[3, 0, -1]}
					scale={[1, 1, 1]}
					onDetect={() => {
						setIsFalling(true);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<mesh
				ref={groupRef}
				receiveShadow
				geometry={nodes.Abstract_Painting.geometry}
				material={materials.Abstract_Painting}
			/>
			<PositionalAudio ref={soundRef} {...impactSound} loop={false} />
		</group>
	);
}

useGLTF.preload('/models/room/painting.glb');
