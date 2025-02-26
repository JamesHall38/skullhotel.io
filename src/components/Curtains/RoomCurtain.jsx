import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import DoubleCurtain from './DoubleCurtain';
import FabricMaterial from '../materials/FabricMaterial';

const CORRIDORLENGTH = 5.95;
const offset = [8.9, 0, 6.1];

export default function RoomCurtain() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const roomCurtains = useDoor((state) => state.roomCurtains);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const setRoomCurtains = useDoor((state) => state.setRoomCurtains);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);
	const { camera } = useThree();
	const material = new FabricMaterial({ isGrayscale: true });

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomCount / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomCount / 2) * CORRIDORLENGTH,
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

		if (isTutorialOpen) {
			calculatedPosition = [2.9, 0, 7.78];
		} else if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomCount, camera, isTutorialOpen]);

	return (
		<DoubleCurtain
			name="room"
			position={position}
			rotation={[0, position[2] < 0 ? 0 : Math.PI, 0]}
			material={material}
			isCurtainOpen={roomCurtain}
			curtains={roomCurtains}
			setCurtain={setRoomCurtain}
			setCurtains={setRoomCurtains}
			roomNumber={roomNumber}
		/>
	);
}
