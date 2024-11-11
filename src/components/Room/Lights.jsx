import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
// import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import { PositionalAudio } from '@react-three/drei';
import DetectionZone from '../DetectionZone';

const PROBABILITY_OF_RED_LIGHT = 20;

export default function Lights() {
	const isMobile = useGame((state) => state.isMobile);
	const seedData = useGame((state) => state.seedData);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const doneObjectives = useInterface((state) => state.interfaceObjectives);
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

		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty) {
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
			{!isMobile && (
				<group>
					<pointLight
						position={[1.5, 2, 0]}
						intensity={roomLight ? 1.2 : 0}
						castShadow
						shadow-mapSize-width={1024}
						shadow-mapSize-height={1024}
						shadow-camera-near={0.1}
						shadow-camera-far={50}
						color={isRedLight ? '#ff0000' : '#fff5e6'}
					/>
					<pointLight
						position={[-1, 2, -3.2]}
						intensity={delayedBathroomLight ? 0.3 : 0}
						castShadow
						shadow-camera-near={0.1}
						shadow-camera-far={50}
						color="#fff5e6"
					/>
				</group>
			)}
			<PositionalAudio
				ref={redLightSoundRef}
				url="/sounds/bulb.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</group>
	);
}
