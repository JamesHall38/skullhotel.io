import { useMemo, useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import Bathroom from './Bathroom';
import Bedroom from './Bedroom';
import Livingroom from './Livingroom';
import CeilingFan from './CeilingFan';
import Switches from './Switches';
import Radio from './Events/Radio';
import Metal from './Metal';
import Painting from './Events/Painting';
import Tv from './Events/Tv';
import Lights from './Lights';
import DetectionZone from '../DetectionZone';

const CORRIDORLENGTH = 5.95;
const offset = [8.83, 0, 6.2];
const PROBABILITY_OF_FLICKER = 20;

export default function Room() {
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const { camera } = useThree();
	const setIsFlashlightFlickering = useGame((state) => state.setIsFlickering);
	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_FLICKER)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_FLICKER),
		[]
	);

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

	const handleFlickerDetection = useCallback(() => {
		setIsFlashlightFlickering(true);
	}, [setIsFlashlightFlickering]);

	return (
		<group
			position={position}
			rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}
		>
			<Bathroom />
			<Bedroom />
			<Livingroom />

			<CeilingFan />

			<Lights />
			<Switches />
			<Radio />
			<Painting />
			<Metal />
			<Tv />

			{isDetectionActive && (
				<DetectionZone
					position={[2, 0, 0]}
					scale={[2, 2, 2]}
					onDetect={handleFlickerDetection}
					onDetectEnd={() => {}}
					downward={true}
				/>
			)}
		</group>
	);
}
