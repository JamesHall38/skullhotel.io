import { useMemo, useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import Bathroom from './Bathroom';
import Bedroom from './Bedroom';
import Livingroom from './Livingroom';
import CeilingFan from './CeilingFan';
import Switches from './Switches';
import Radio from './Radio';
import Metal from './Metal';
import Painting from './Painting';

const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];

export default function Room() {
	const seedData = useGame((state) => state.seedData);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomLight = useGame((state) => state.roomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);

	const doneObjectives = useInterface((state) => state.interfaceObjectives);
	const roomDoor = useDoor((state) => state.roomDoor);

	const { camera } = useThree();
	const neonSoundRef = useRef();
	const soundPlayed = useRef(false);

	const doneObjectivesNumberRef = useRef(doneObjectives);

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

	const [doorsAreClosedMoreThan1Second, setDoorsAreClosedMoreThan1Second] =
		useState(true);
	let timeout = useRef(null);

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomTotal / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		} else {
			calculatedPosition = [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}

		if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		} else if (camera.position.x <= 8 && camera.position.x > 4.4) {
			calculatedPosition = [3.02, 0, 7.9];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

	useEffect(() => {
		if (!roomDoor.some((door) => door)) {
			timeout.current = setTimeout(() => {
				setDoorsAreClosedMoreThan1Second(true);
			}, 1200);
		} else {
			setDoorsAreClosedMoreThan1Second(false);
			clearTimeout(timeout.current);
		}
	}, [roomDoor]);

	useEffect(() => {
		const probability = doneObjectivesNumberRef.current / 9;

		if (!doorsAreClosedMoreThan1Second) {
			if (
				!seedData[playerPositionRoom] ||
				seedData[playerPositionRoom]?.empty
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
		} else {
			setRoomLight(false);
			setBathroomLight(false);
		}

		if (bathroomLight && !soundPlayed.current) {
			neonSoundRef.current.play();
			soundPlayed.current = true;
		} else if (!bathroomLight) {
			soundPlayed.current = false;
			neonSoundRef.current.stop();
		}
	}, [
		seedData,
		playerPositionRoom,
		doneObjectivesNumberRef,
		setRoomLight,
		setBathroomLight,
		doorsAreClosedMoreThan1Second,
		bathroomLight,
	]);

	return (
		<group
			position={position}
			rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}
		>
			<pointLight
				position={[1.5, 2, 0]}
				intensity={roomLight ? 4 : 0}
				castShadow
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-camera-near={0.1}
				shadow-camera-far={50}
			/>
			<pointLight
				position={[-1, 2, -3.2]}
				intensity={bathroomLight ? 0.4 : 0}
				castShadow
				shadow-camera-near={0.1}
				shadow-camera-far={50}
			/>
			<PositionalAudio
				ref={neonSoundRef}
				url="/sounds/neon.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.25}
			/>
			<Bathroom key="bathroom1" />
			<Bathroom invert key="bathroom2" position={[-3.32, 0.0, 0]} />
			<mesh
				position={[-1.65, 1.3, -3.25]}
				rotation={[0, Math.PI / 2, 0]}
				frustumCulled={false}
				renderOrder={-1}
			>
				<planeGeometry args={[2, 1]} />
				<meshPhysicalMaterial
					transparent
					polygonOffset
					opacity={0.6}
					polygonOffsetFactor={-1}
					roughness={0.1}
					metalness={1}
					color="white"
				/>
			</mesh>
			<Bedroom />
			<Livingroom />
			<CeilingFan />
			<Switches />
			<Radio />
			<Painting />
			<Metal />
		</group>
	);
}
