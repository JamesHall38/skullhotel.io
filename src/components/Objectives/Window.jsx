import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations, PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';
import levelData from '../../data/levelData';

const CORRIDORLENGTH = 5.95;
const offset = [8.43, 1.2, 11.52];

export default function Window() {
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const group = useRef();
	const meshRef = useRef();
	const { nodes, animations } = useGLTF('/models/objectives/window.glb');
	const { actions } = useAnimations(animations, group);
	const { camera } = useThree();
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[2]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const [delayedRoomCurtain, setDelayedRoomCurtain] = useState(roomCurtain);

	const windowSoundRef = useRef();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDelayedRoomCurtain(roomCurtain);
		}, 500);

		return () => clearTimeout(timeout);
	}, [roomCurtain]);

	function findTypeAndNumber(arr, index) {
		let cumulativeLength = 0;
		for (let i = 0; i < arr.length; i++) {
			const currentLength = arr[i].length;
			if (index <= cumulativeLength + currentLength - 1) {
				const number = index - cumulativeLength;
				return { type: i, number };
			}
			cumulativeLength += currentLength;
		}
		return { type: 0, number: 0 };
	}

	const { type, number } = useMemo(
		() => findTypeAndNumber(levelData, playerPositionRoom),
		[playerPositionRoom]
	);

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
			calculatedPosition = [3.4, 1.2, 13.24];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

	const checkProximity = useCallback(() => {
		return Math.abs(camera.position.z) > 9;
	}, [camera]);

	const handleClick = () => {
		if (
			checkProximity() &&
			delayedRoomCurtain &&
			!(type === 3 && number === 0)
		) {
			Object.values(actions).forEach((action) => {
				if (!action.isRunning()) {
					if (action && action.time !== action.getClip().duration) {
						action.clampWhenFinished = true;
						action.timeScale = 2;
						action.loop = THREE.LoopOnce;
						action.repetitions = 1;

						// Play the window sound
						if (windowSoundRef.current) {
							windowSoundRef.current.play();
						}

						action.play();
						setInterfaceObjectives(2, roomNumber);
					}
				}
			});
		}
	};

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			Object.values(actions).forEach((action) => {
				if (action) {
					action.stop();
					action.reset();
				}
			});
		} else {
			isInit.current = true;
			if (objective) {
				Object.values(actions).forEach((action) => {
					if (!action.isRunning()) {
						if (action && action.time !== action.getClip().duration) {
							action.clampWhenFinished = true;
							action.timeScale = 2;
							action.loop = THREE.LoopOnce;
							action.repetitions = 1;
							action.play();
							action.time = 10;
						}
					}
				});
			}
		}
	}, [objective, actions]);

	return (
		<group
			ref={group}
			position={position}
			rotation={[0, position[2] < 0 ? Math.PI : 0, 0]}
			dispose={null}
		>
			<group name="Scene">
				<mesh
					ref={meshRef}
					position={[1, 0, 0]}
					onPointerDown={() => handleClick()}
				>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="green" visible={false} />
				</mesh>
				<mesh
					name="Window"
					geometry={nodes.Window.geometry}
					material={nodes.Window.material}
				/>
			</group>
			<PositionalAudio
				ref={windowSoundRef}
				url="/sounds/window.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</group>
	);
}

useGLTF.preload('/models/objectives/window.glb');
