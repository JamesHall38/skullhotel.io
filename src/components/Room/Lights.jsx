import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useLight from '../../hooks/useLight';

export default function Lights() {
	const seedData = useGame((state) => state.seedData);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const monsterState = useMonster((state) => state.monsterState);
	const doneObjectives = useInterface((state) => state.interfaceObjectives);
	const isJumpscareActive = useGame((state) => state.jumpScare);
	const roomLight = useGame((state) => state.roomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setRightLight = useLight((state) => state.setRightLight);
	const setLeftLight = useLight((state) => state.setLeftLight);
	const setWallLight = useLight((state) => state.setWallLight);
	const setCouchLight = useLight((state) => state.setCouchLight);
	const doneObjectivesNumberRef = useRef(doneObjectives);
	const mainLightRef = useRef();
	const bathroomLightRef = useRef();
	const deaths = useGame((state) => state.deaths);

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
		const totalSteps = 6;
		const currentStep = Math.floor(
			(doneObjectivesNumberRef.current / (roomCount / 2)) * totalSteps
		);

		if (
			!seedData[playerPositionRoom] ||
			seedData[playerPositionRoom]?.type === 'empty'
		) {
			setRoomLight(currentStep < 1);
			setLeftLight('#fff9eb', currentStep < 2 ? 0.5 : 0);
			setBathroomLight(currentStep < 3);
			setRightLight('#fff9eb', currentStep < 4 ? 0.5 : 0);
			setWallLight('#ffffff', currentStep < 5 ? 0.5 : 0);
			setCouchLight('#ff0000', currentStep < 6 ? 0.5 : 0);
		} else {
			if (seedData[playerPositionRoom].roomLight === 'off') {
				setRoomLight(false);
			} else if (seedData[playerPositionRoom].roomLight === 'on') {
				setRoomLight(true);
			} else {
				setRoomLight(
					Math.random() > doneObjectivesNumberRef.current / (roomCount / 2)
				);
			}

			// if (seedData[playerPositionRoom].bathroomLight === 'off') {
			// 	setBathroomLight(false);
			// } else if (seedData[playerPositionRoom].bathroomLight === 'on') {
			// 	setBathroomLight(true);
			// } else {
			// 	setBathroomLight(
			// 		Math.random() > doneObjectivesNumberRef.current / (roomCount / 2)
			// 	);
			// }
		}
	}, [
		seedData,
		playerPositionRoom,
		setRoomLight,
		setBathroomLight,
		roomCount,
		setLeftLight,
		setRightLight,
		setWallLight,
		setCouchLight,
	]);

	const [delayedBathroomLight, setDelayedBathroomLight] = useState(false);
	const [flickerIntensity, setFlickerIntensity] = useState(0);

	useEffect(() => {
		let intervalId;
		if (bathroomLight) {
			intervalId = setInterval(() => {
				setFlickerIntensity(Math.random() * 0.3);
			}, 50);

			const timer = setTimeout(() => {
				clearInterval(intervalId);
				setFlickerIntensity(0.3);
				setDelayedBathroomLight(true);
			}, 1600);
			return () => {
				clearTimeout(timer);
				clearInterval(intervalId);
			};
		} else {
			setDelayedBathroomLight(false);
			setFlickerIntensity(0);
		}
	}, [bathroomLight]);

	const jumpScare = useCallback(() => {
		if (!mainLightRef.current || !bathroomLightRef.current) return;

		let progress = 0;
		const duration = 1500;
		const interval = 50;
		const maxIntensity = 1;

		const timer = setInterval(() => {
			if (!mainLightRef.current || !bathroomLightRef.current) {
				clearInterval(timer);
				return;
			}

			progress += interval / duration;
			const intensity = progress * maxIntensity;

			mainLightRef.current.color = new THREE.Color('#ff0000');
			mainLightRef.current.intensity = intensity;
			bathroomLightRef.current.color = new THREE.Color('#ff0000');
			bathroomLightRef.current.intensity = intensity;

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

	useEffect(() => {
		if (mainLightRef.current && bathroomLightRef.current) {
			mainLightRef.current.color = new THREE.Color('#fff5e6');
			mainLightRef.current.intensity = roomLight ? 1.2 : 0;
			bathroomLightRef.current.color = new THREE.Color('#fff5e6');
			bathroomLightRef.current.intensity = bathroomLight ? 0.3 : 0;
		}
	}, [deaths, roomLight, bathroomLight]);

	return (
		<group>
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
					castShadow
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-near={1}
					shadow-camera-far={10}
					color={isJumpscareActive ? mainLightRef.current?.color : '#fff5e6'}
				/>
				<pointLight
					ref={bathroomLightRef}
					position={[-1, 2, -3.2]}
					intensity={
						isJumpscareActive
							? bathroomLightRef.current?.intensity
							: delayedBathroomLight
							? 0.3
							: flickerIntensity
					}
					castShadow
					shadow-camera-near={1}
					shadow-camera-far={10}
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					color={
						isJumpscareActive ? bathroomLightRef.current?.color : '#fff5e6'
					}
				/>
			</group>
		</group>
	);
}
