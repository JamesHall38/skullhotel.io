import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import useMonster from '../../hooks/useMonster';
// import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import { PositionalAudio } from '@react-three/drei';
import DetectionZone from '../DetectionZone';
import { usePositionalSound } from '../../utils/audio';

const PROBABILITY_OF_RED_LIGHT = 20;

export default function Lights() {
	const seedData = useGame((state) => state.seedData);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const monsterState = useMonster((state) => state.monsterState);
	const doneObjectives = useInterface((state) => state.interfaceObjectives);
	const isJumpscareActive = useGame((state) => state.jumpScare);
	// const roomDoor = useDoor((state) => state.roomDoor);
	// const soundPlayed = useRef(false);
	const roomLight = useGame((state) => state.roomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	// const loading = useGame((state) => state.loading);
	const doneObjectivesNumberRef = useRef(doneObjectives);
	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [isRedLight, setIsRedLight] = useState(false);
	const [activeRedLights, setActiveRedLights] = useState([]);
	const redLightSoundRef = useRef();
	const firstRedLightPlayed = useRef(false);
	const mainLightRef = useRef();
	const performanceMode = useGame((state) => state.performanceMode);
	const bulbSound = usePositionalSound('bulb');

	const doneObjectivesNumber = useMemo(() => {
		const count = doneObjectives?.reduce((acc, subArray) => {
			if (subArray.every(Boolean)) {
				return acc + 1;
			}
			return acc;
		}, 0);
		return count;
	}, [doneObjectives]);

	useEffect(() => {
		doneObjectivesNumberRef.current = doneObjectivesNumber || 0;
	}, [doneObjectivesNumber]);

	useEffect(() => {
		const probability = doneObjectivesNumberRef.current / 9;

		if (
			!seedData[playerPositionRoom] ||
			seedData[playerPositionRoom]?.type === 'empty'
		) {
			setRoomLight(Math.random() > probability);
			setBathroomLight(Math.random() > probability);
		} else {
			if (seedData[playerPositionRoom].roomLight === 'off') {
				setRoomLight(false);
			} else if (seedData[playerPositionRoom].roomLight === 'on') {
				setRoomLight(true);
			} else {
				setRoomLight(Math.random() > probability);
			}

			if (seedData[playerPositionRoom].bathroomLight === 'off') {
				setBathroomLight(false);
			} else if (seedData[playerPositionRoom].bathroomLight === 'on') {
				setBathroomLight(true);
			} else {
				setBathroomLight(Math.random() > probability);
			}
		}
		// } else {
		// 	setRoomLight(false);
		// 	setBathroomLight(false);
		// }
	}, [seedData, playerPositionRoom, setRoomLight, setBathroomLight]);

	useEffect(() => {
		if (isRedLight && !firstRedLightPlayed.current) {
			redLightSoundRef.current.play();
			firstRedLightPlayed.current = true;
		} else {
			redLightSoundRef.current.pause();
		}
	}, [isRedLight]);

	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_RED_LIGHT)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_RED_LIGHT),
		[]
	);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
		setActiveRedLights([]);
	}, [deaths, generateRandomRoomNumber]);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber) {
			setIsDetectionActive(true);
		} else {
			setIsDetectionActive(false);
		}
		setIsRedLight(activeRedLights.includes(playerPositionRoom));
	}, [playerPositionRoom, randomRoomNumber, activeRedLights]);

	const [delayedBathroomLight, setDelayedBathroomLight] = useState(false);

	useEffect(() => {
		if (bathroomLight) {
			const timer = setTimeout(() => {
				setDelayedBathroomLight(true);
			}, 1600);
			return () => clearTimeout(timer);
		} else {
			setDelayedBathroomLight(false);
		}
	}, [bathroomLight]);

	const jumpScare = useCallback(() => {
		if (!mainLightRef.current) return;

		let progress = 0;
		const duration = 1500;
		const interval = 50;
		const maxIntensity = 1;

		const timer = setInterval(() => {
			if (!mainLightRef.current) {
				clearInterval(timer);
				return;
			}

			progress += interval / duration;
			const intensity = progress * maxIntensity;

			mainLightRef.current.color = new THREE.Color('#ff0000');
			mainLightRef.current.intensity = intensity;

			if (progress >= 1) {
				clearInterval(timer);
			}
		}, interval);
	}, []);

	useEffect(() => {
		if (monsterState === 'run' || monsterState === 'attack') {
			jumpScare();
		}
	}, [monsterState, jumpScare]);

	return (
		<group>
			{isDetectionActive && !activeRedLights.includes(playerPositionRoom) && (
				<DetectionZone
					position={[2, 0, 0]}
					scale={[2, 2, 2]}
					onDetect={() => {
						setIsRedLight(true);
						setActiveRedLights((prev) => [...prev, playerPositionRoom]);
					}}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
			<group>
				<pointLight
					ref={mainLightRef}
					position={[1.5, 2, 0]}
					intensity={
						isJumpscareActive
							? mainLightRef.current?.intensity
							: roomLight
							? 1.2
							: 0
					}
					castShadow={performanceMode}
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-near={1}
					shadow-camera-far={10}
					color={isJumpscareActive ? mainLightRef.current?.color : '#fff5e6'}
				/>
				<pointLight
					position={[-1, 2, -3.2]}
					intensity={delayedBathroomLight ? 0.3 : 0}
					castShadow={performanceMode}
					shadow-camera-near={1}
					shadow-camera-far={10}
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					color="#fff5e6"
				/>
			</group>
			{/* )} */}
			<PositionalAudio ref={redLightSoundRef} {...bulbSound} loop={false} />
		</group>
	);
}
