import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import useGame from '../../hooks/useGame';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useDoor from '../../hooks/useDoor';

const MAX_INTENSITY = 1.5;
const BATHROOM_MAX_INTENSITY = MAX_INTENSITY / 2;
const ANIMATION_SPEED = 2;
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
	const [animatedMode, setAnimatedMode] = useState(false);
	const [isIntensityIncreasing, setIsIntensityIncreasing] = useState(false);
	const roomLightRef = useRef();
	const bathroomLightRef = useRef();
	const savedRoomIntensity = useRef(0);
	const savedBathroomIntensity = useRef(0);
	const savedRoomColor = useRef(new Color());
	const savedBathroomColor = useRef(new Color());
	const roomLightsStateRef = useRef(Array(roomCount).fill(false));
	const bathroomLightsStateRef = useRef(Array(roomCount).fill(false));
	const playerPositionRoomRef = useRef(playerPositionRoom);

	useEffect(() => {
		playerPositionRoomRef.current = playerPositionRoom;
	}, [playerPositionRoom]);

	const updateLightColor = (
		intensity,
		maxIntensity,
		light,
		baseIntensity = 0,
		savedColor
	) => {
		const availableRange = maxIntensity - baseIntensity;
		const t =
			availableRange > 0 ? (intensity - baseIntensity) / availableRange : 0;
		light.current.color
			.copy(savedColor || DEFAULT_COLOR)
			.lerp(TARGET_COLOR, Math.max(0, Math.min(1, t)));
	};

	const resetLights = useCallback(() => {
		setAnimatedMode(false);
		setIsIntensityIncreasing(false);
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
		if (!animatedMode && playerPositionRoomRef.current !== null) {
			roomLightsStateRef.current[playerPositionRoomRef.current] = roomLight;
		}
	}, [roomLight, animatedMode]);

	useEffect(() => {
		if (!animatedMode && playerPositionRoomRef.current !== null) {
			bathroomLightsStateRef.current[playerPositionRoomRef.current] =
				bathroomLight;
		}
	}, [bathroomLight, animatedMode]);

	useEffect(() => {
		if (playerPositionRoom !== null && !animatedMode) {
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
		animatedMode,
		roomLight,
		bathroomLight,
		setRoomLight,
		setBathroomLight,
	]);

	useEffect(() => {
		if (!animatedMode) {
			roomLightRef.current.intensity = roomLight ? 1.2 : 0;
			roomLightRef.current.color.copy(DEFAULT_COLOR);
		}
	}, [roomLight, animatedMode]);

	useEffect(() => {
		if (!animatedMode) {
			bathroomLightRef.current.intensity = bathroomLight ? 0.3 : 0;
			bathroomLightRef.current.color.copy(DEFAULT_COLOR);
		}
	}, [bathroomLight, animatedMode]);

	useEffect(() => {
		if (tutorialDoor) {
			setRoomLight(true);
		}
		if (tutorialDoor) {
			setBathroomLight(true);
		}
	}, [tutorialDoor, setRoomLight, setBathroomLight]);

	useEffect(() => {
		if (shakeIntensity > 0 && !animatedMode && !isIntensityIncreasing) {
			savedRoomIntensity.current = roomLightRef.current.intensity;
			savedBathroomIntensity.current = bathroomLightRef.current.intensity;
			savedRoomColor.current.copy(
				roomLightRef.current.intensity < 0.01 ? TARGET_COLOR : DEFAULT_COLOR
			);
			savedBathroomColor.current.copy(
				bathroomLightRef.current.intensity < 0.01 ? TARGET_COLOR : DEFAULT_COLOR
			);
			setAnimatedMode(true);
			setIsIntensityIncreasing(true);
		} else if (shakeIntensity > 0 && animatedMode && !isIntensityIncreasing) {
			setIsIntensityIncreasing(true);
		}
	}, [shakeIntensity, animatedMode, isIntensityIncreasing]);

	useFrame((_, delta) => {
		if (animatedMode) {
			if (isIntensityIncreasing) {
				const newRoomIntensity =
					roomLightRef.current.intensity + ANIMATION_SPEED * delta;
				const newBathroomIntensity =
					bathroomLightRef.current.intensity + ANIMATION_SPEED * delta;

				if (
					newRoomIntensity >= MAX_INTENSITY &&
					newBathroomIntensity >= BATHROOM_MAX_INTENSITY
				) {
					setIsIntensityIncreasing(false);
					roomLightRef.current.intensity = MAX_INTENSITY;
					bathroomLightRef.current.intensity = BATHROOM_MAX_INTENSITY;
					updateLightColor(
						MAX_INTENSITY,
						MAX_INTENSITY,
						roomLightRef,
						savedRoomIntensity.current,
						savedRoomColor.current
					);
					updateLightColor(
						BATHROOM_MAX_INTENSITY,
						BATHROOM_MAX_INTENSITY,
						bathroomLightRef,
						savedBathroomIntensity.current,
						savedBathroomColor.current
					);
				} else {
					roomLightRef.current.intensity = Math.min(
						newRoomIntensity,
						MAX_INTENSITY
					);
					bathroomLightRef.current.intensity = Math.min(
						newBathroomIntensity,
						BATHROOM_MAX_INTENSITY
					);
					updateLightColor(
						roomLightRef.current.intensity,
						MAX_INTENSITY,
						roomLightRef,
						savedRoomIntensity.current,
						savedRoomColor.current
					);
					updateLightColor(
						bathroomLightRef.current.intensity,
						BATHROOM_MAX_INTENSITY,
						bathroomLightRef,
						savedBathroomIntensity.current,
						savedBathroomColor.current
					);
				}
			} else {
				const newRoomIntensity =
					roomLightRef.current.intensity - ANIMATION_SPEED * delta;
				const newBathroomIntensity =
					bathroomLightRef.current.intensity - ANIMATION_SPEED * delta;

				if (
					Math.abs(newRoomIntensity - savedRoomIntensity.current) < 0.01 &&
					Math.abs(newBathroomIntensity - savedBathroomIntensity.current) < 0.01
				) {
					setAnimatedMode(false);
					roomLightRef.current.intensity = savedRoomIntensity.current;
					bathroomLightRef.current.intensity = savedBathroomIntensity.current;
					roomLightRef.current.color.copy(savedRoomColor.current);
					bathroomLightRef.current.color.copy(savedBathroomColor.current);
				} else {
					roomLightRef.current.intensity = Math.max(
						newRoomIntensity,
						savedRoomIntensity.current
					);
					bathroomLightRef.current.intensity = Math.max(
						newBathroomIntensity,
						savedBathroomIntensity.current
					);
					updateLightColor(
						roomLightRef.current.intensity,
						MAX_INTENSITY,
						roomLightRef,
						savedRoomIntensity.current,
						savedRoomColor.current
					);
					updateLightColor(
						bathroomLightRef.current.intensity,
						BATHROOM_MAX_INTENSITY,
						bathroomLightRef,
						savedBathroomIntensity.current,
						savedBathroomColor.current
					);
				}
			}
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
