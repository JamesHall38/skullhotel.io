import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import DoubleCurtain from './DoubleCurtain';

const CORRIDORLENGTH = 5.95;
const offset = [8.35, 0.35, 7.75];

export default function BathroomCurtain({ positionOffset }) {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const bathroomCurtains = useDoor((state) => state.bathroomCurtains);
	const setBathroomCurtain = useDoor((state) => state.setBathroomCurtain);
	const setBathroomCurtains = useDoor((state) => state.setBathroomCurtains);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const { camera } = useThree();

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
			calculatedPosition = [3.5, 0.35, 9.45];
		}

		return [
			calculatedPosition[0] +
				((positionOffset
					? roomNumber >= roomTotal / 2
						? positionOffset
						: -positionOffset
					: 0) || 0),
			calculatedPosition[1],
			calculatedPosition[2],
		];
	}, [playerPositionRoom, roomTotal, positionOffset, roomNumber, camera]);

	return (
		<group position={position} scale={[0.75, 1, 1]}>
			<DoubleCurtain
				rotation={[0, position[2] < 0 ? Math.PI : 0, 0]}
				isCurtainOpen={bathroomCurtain}
				curtains={bathroomCurtains}
				setCurtain={setBathroomCurtain}
				setCurtains={setBathroomCurtains}
				roomNumber={roomNumber}
			/>
		</group>
	);
}
