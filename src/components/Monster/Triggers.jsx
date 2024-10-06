import { useEffect, useMemo, useRef } from 'react';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useDoor from '../../hooks/useDoor';
import useInterface from '../../hooks/useInterface';
import * as THREE from 'three';
import TriggersConditions from './TriggersConditions';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];
const monsterBoxScale = 2.5;
const visible = true;

function getAdjustedPosition(initialPosition, isFacingRoom) {
	if (!isFacingRoom) return initialPosition;
	return [-initialPosition[0], initialPosition[1], -initialPosition[2]];
}

export default function Triggers() {
	// Game state
	const seedData = useGame((state) => state.seedData);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setCameraShakingWhenLookingAtMonster = useGame(
		(state) => state.setCameraShakingWhenLookingAtMonster
	);

	const interfaceObjectives = useInterface(
		(state) => state.interfaceObjectives
	);

	// Monster
	const playAnimation = useMonster((state) => state.playAnimation);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);

	// Doors
	const setBathroomDoor = useDoor((state) => state.setBathroomDoor);

	const zoneBox = useRef();
	const monsterBox = useRef();
	const instantBox = useRef();

	const type = seedData[playerPositionRoom]?.type || 0;
	const number = seedData[playerPositionRoom]?.number || 0;

	const position = useMemo(() => {
		if (playerPositionRoom >= roomTotal / 2) {
			return [
				-CORRIDORLENGTH * 2 +
					offset[0] +
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH +
					(playerPositionRoom >= roomTotal / 2 ? 0.2 : 0),
				offset[1],
				-offset[2] + 12.4,
			];
		} else {
			return [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}
	}, [roomTotal, playerPositionRoom]);

	// Generate box3 to detect collisions
	useEffect(() => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return undefined;
		const isFacingRoom = playerPositionRoom >= roomTotal / 2;

		const getBox3 = (boxData, scale = [1, 1, 1]) => {
			const adjustedPosition = getAdjustedPosition(
				[
					position[0] + (boxData?.[0] || 0),
					position[1] + (boxData?.[1] || 0),
					position[2] + (boxData?.[2] || 0),
				],
				isFacingRoom
			);
			const min = new THREE.Vector3(
				adjustedPosition[0] - 0.5 * scale[0],
				adjustedPosition[1] + 0.5 * scale[1],
				adjustedPosition[2] - 0.5 * scale[2]
			);
			const max = new THREE.Vector3(
				adjustedPosition[0] + 0.5 * scale[0],
				adjustedPosition[1] + 1.5 * scale[1],
				adjustedPosition[2] + 0.5 * scale[2]
			);
			const box = new THREE.Box3(min, max);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const size = new THREE.Vector3();
			box.getSize(size);
			box.setFromCenterAndSize(center, size);
			return box;
		};

		monsterBox.current = getBox3(
			[
				seedData[playerPositionRoom].monsterPosition?.[0] || 0,
				type === 4 ? (number === 4 ? -1 : 0.6) : -1,
				seedData[playerPositionRoom].monsterPosition?.[2] || 0,
			],
			[monsterBoxScale, monsterBoxScale, monsterBoxScale]
		);
		zoneBox.current = getBox3(
			seedData[playerPositionRoom].position,
			seedData[playerPositionRoom].scale
		);
		instantBox.current = getBox3(
			seedData[playerPositionRoom].instantTriggerPosition,
			seedData[playerPositionRoom].instantTriggerScale
		);
	}, [
		seedData,
		number,
		position,
		type,
		setMonsterRotation,
		setMonsterState,
		playAnimation,
		playerPositionRoom,
		roomTotal,
	]);

	// Set monster position on objective trigger
	useEffect(() => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return undefined;
		if (
			interfaceObjectives[playerPositionRoom]?.[
				seedData[playerPositionRoom].trigger?.objective
			]
		) {
			if (type === 4) {
				playAnimation('Run');
				setMonsterState('run');
			} else {
				setCameraShakingWhenLookingAtMonster(true);
				setMonsterPosition(
					getAdjustedPosition(
						[
							position[0] +
								(seedData[playerPositionRoom].monsterPosition?.[0] || 0),
							position[1] +
								(seedData[playerPositionRoom].monsterPosition?.[1] || 0),
							position[2] +
								(seedData[playerPositionRoom].monsterPosition?.[2] || 0),
						],
						playerPositionRoom >= roomTotal / 2
					)
				);
				playAnimation('Idle');
				if (seedData[playerPositionRoom].trigger?.bathroomDoor) {
					setBathroomDoor(true);
				}
				setTimeout(() => {
					setAnimationMixSpeed(4);
				}, 100);
			}
		}
	}, [
		seedData,
		interfaceObjectives,
		playerPositionRoom,
		number,
		playAnimation,
		position,
		type,
		setAnimationMixSpeed,
		setBathroomDoor,
		setMonsterPosition,
		roomTotal,
		setCameraShakingWhenLookingAtMonster,
		setMonsterState,
	]);

	return (
		<>
			<TriggersConditions
				monsterBox={monsterBox}
				zoneBox={zoneBox}
				instantBox={instantBox}
				position={position}
			/>
			{visible && (
				<group
					rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}
					visible={!seedData[playerPositionRoom]?.empty}
				>
					<mesh
						geometry={boxGeometry}
						position={[
							position[0] + (seedData[playerPositionRoom]?.position?.[0] || 0),
							position[1] + (seedData[playerPositionRoom]?.position?.[1] || 0),
							position[2] + (seedData[playerPositionRoom]?.position?.[2] || 0),
						]}
						scale={seedData[playerPositionRoom]?.scale}
					>
						<meshBasicMaterial
							color="indianred"
							transparent={true}
							opacity={0.25}
						/>
					</mesh>
					<mesh
						geometry={boxGeometry}
						position={[
							position[0] +
								(seedData[playerPositionRoom]?.monsterPosition?.[0] || 0),
							position[1] +
								(seedData[playerPositionRoom]?.monsterPosition?.[1] || 0),
							position[2] +
								(seedData[playerPositionRoom]?.monsterPosition?.[2] || 0),
						]}
						scale={monsterBoxScale}
					>
						<meshBasicMaterial color="red" transparent={true} opacity={0.25} />
					</mesh>
					<mesh
						geometry={boxGeometry}
						position={[
							position[0] +
								(seedData[playerPositionRoom]?.instantTriggerPosition?.[0] ||
									0),
							position[1] +
								(seedData[playerPositionRoom]?.instantTriggerPosition?.[1] ||
									0),
							position[2] +
								(seedData[playerPositionRoom]?.instantTriggerPosition?.[2] ||
									0),
						]}
						scale={seedData[playerPositionRoom]?.instantTriggerScale}
					>
						<meshBasicMaterial color="blue" transparent={true} opacity={0.25} />
					</mesh>
				</group>
			)}
		</>
	);
}
