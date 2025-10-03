import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import useGame from '../../hooks/useGame';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useDoor from '../../hooks/useDoor';

const TARGET_COLOR = new Color('#ff0000');
const DEFAULT_COLOR = new Color('#fff5e6');

export default function Lights() {
	const roomLight = useGame((state) => state.roomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const shakeIntensity = useGame((state) => state.shakeIntensity);
	const deaths = useGame((state) => state.deaths);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const tutorialDoor = useDoor((state) => state.tutorial);
	const roomLightRef = useRef();
	const bathroomLightRef = useRef();
	const roomLightsStateRef = useRef(Array(roomCount).fill(false));
	const bathroomLightsStateRef = useRef(Array(roomCount).fill(false));
	const playerPositionRoomRef = useRef(playerPositionRoom);

	useEffect(() => {
		playerPositionRoomRef.current = playerPositionRoom;
	}, [playerPositionRoom]);

	const resetLights = useCallback(() => {
		roomLightRef.current.intensity = 0;
		roomLightRef.current.color.copy(DEFAULT_COLOR);
		bathroomLightRef.current.intensity = 0;
		bathroomLightRef.current.color.copy(DEFAULT_COLOR);
		roomLightsStateRef.current = Array(roomCount).fill(false);
		bathroomLightsStateRef.current = Array(roomCount).fill(false);
	}, [roomCount]);

	useEffect(() => {
		if (deaths > 0) {
			resetLights();
		}
	}, [deaths, resetLights]);

	useEffect(() => {
		if (playerPositionRoomRef.current !== null) {
			roomLightsStateRef.current[playerPositionRoomRef.current] = roomLight;
		}
	}, [roomLight]);

	useEffect(() => {
		if (playerPositionRoomRef.current !== null) {
			bathroomLightsStateRef.current[playerPositionRoomRef.current] =
				bathroomLight;
		}
	}, [bathroomLight]);

	useEffect(() => {
		if (playerPositionRoom !== null) {
			const savedRoomLightState =
				roomLightsStateRef.current[playerPositionRoom];
			const savedBathroomLightState =
				bathroomLightsStateRef.current[playerPositionRoom];

			if (roomLight !== savedRoomLightState) {
				setRoomLight(savedRoomLightState);
			}

			if (bathroomLight !== savedBathroomLightState) {
				setBathroomLight(savedBathroomLightState);
			}
		}
	}, [
		playerPositionRoom,
		roomLight,
		bathroomLight,
		setRoomLight,
		setBathroomLight,
	]);

	useEffect(() => {
		if (tutorialDoor) {
			setRoomLight(true);
		}
		if (tutorialDoor) {
			setBathroomLight(true);
		}
	}, [tutorialDoor, setRoomLight, setBathroomLight]);

	useFrame(() => {
		const isShaking = shakeIntensity > 0;

		if (isShaking) {
			roomLightRef.current.intensity = 1.2;
			roomLightRef.current.color.copy(TARGET_COLOR);
			bathroomLightRef.current.intensity = 0.3;
			bathroomLightRef.current.color.copy(TARGET_COLOR);
		} else {
			roomLightRef.current.intensity = roomLight ? 1.2 : 0;
			roomLightRef.current.color.copy(DEFAULT_COLOR);
			bathroomLightRef.current.intensity = bathroomLight ? 0.3 : 0;
			bathroomLightRef.current.color.copy(DEFAULT_COLOR);
		}
	});

	return (
		<group>
			<pointLight
				ref={roomLightRef}
				position={[1.5, 2, 0]}
				castShadow
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-camera-near={1}
				shadow-camera-far={10}
			/>
			<pointLight
				ref={bathroomLightRef}
				position={[-1, 2, -3.2]}
				castShadow
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-camera-near={1}
				shadow-camera-far={10}
			/>
		</group>
	);
}
