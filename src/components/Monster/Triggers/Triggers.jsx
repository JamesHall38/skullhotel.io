import { useEffect, useMemo, useRef } from 'react';
import useGame from '../../../hooks/useGame';
import useMonster from '../../../hooks/useMonster';
import * as THREE from 'three';
import TriggersConditions from './TriggersConditions';
import { getMonsterInitialPosition } from './triggersUtils';
import { useControls } from 'leva';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];

const BOXES_CONFIG = {
	green: {
		getInitialPosition: (seedData, room) =>
			seedData[room]?.position || [0, 0, 0],
		getInitialScale: (seedData, room) => seedData[room]?.scale || [1, 1, 1],
		label: 'Green',
		ref: 'zoneBox',
	},
	red: {
		getInitialPosition: (seedData, room) =>
			seedData[room]?.monsterPosition || [0, 0, 0],
		getInitialScale: () => [2.5, 2.5, 2.5],
		label: 'Red',
		ref: 'monsterBox',
	},
	blue: {
		getInitialPosition: (seedData, room) =>
			seedData[room]?.instantTriggerPosition || [0, 0, 0],
		getInitialScale: (seedData, room) =>
			seedData[room]?.instantTriggerScale || [1, 1, 1],
		label: 'Blue',
		ref: 'instantBox',
	},
	yellow: {
		getInitialPosition: (seedData, room) =>
			seedData[room]?.cameraShakingPosition || [0, 0, 0],
		getInitialScale: (seedData, room) =>
			seedData[room]?.cameraShakingScale || [0, 0, 0],
		label: 'Yellow',
		ref: 'cameraShakingBox',
	},
};

const MONSTER_CONFIG = {
	getInitialPosition: (seedData, room) =>
		seedData[room]?.monsterInitialPosition || [0, 0, 0],
	getInitialRotation: (seedData, room) =>
		seedData[room]?.monsterInitialRotation || [0, 0, 0],
};

export default function Triggers() {
	const seedData = useGame((state) => state.seedData);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);

	const greenRef = useRef();
	const redRef = useRef();
	const blueRef = useRef();
	const yellowRef = useRef();

	const boxRefs = useMemo(
		() => ({
			green: greenRef,
			red: redRef,
			blue: blueRef,
			yellow: yellowRef,
		}),
		[]
	);

	const [controls, set] = useControls(() => ({
		visible: {
			value: false,
			label: 'Show Trigger Boxes',
		},
		monsterInitialPosition: {
			value: MONSTER_CONFIG.getInitialPosition(
				Object.values(seedData),
				playerPositionRoom
			),
			label: 'Monster Position',
		},
		monsterInitialRotation: {
			value: MONSTER_CONFIG.getInitialRotation(
				Object.values(seedData),
				playerPositionRoom
			),
			label: 'Monster Rotation',
		},
		...Object.entries(BOXES_CONFIG).reduce(
			(acc, [color, config]) => ({
				...acc,
				[`${color}Position`]: {
					value: config.getInitialPosition(
						Object.values(seedData),
						playerPositionRoom
					),
					label: `${config.label} Position`,
				},
				[`${color}Scale`]: {
					value: config.getInitialScale(
						Object.values(seedData),
						playerPositionRoom
					),
					label: `${config.label} Scale`,
				},
			}),
			{}
		),
	}));

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

	// Update effect
	useEffect(() => {
		const updates = {
			monsterInitialPosition: MONSTER_CONFIG.getInitialPosition(
				Object.values(seedData),
				playerPositionRoom
			),
			monsterInitialRotation: MONSTER_CONFIG.getInitialRotation(
				Object.values(seedData),
				playerPositionRoom
			),
			...Object.entries(BOXES_CONFIG).reduce(
				(acc, [color, config]) => ({
					...acc,
					[`${color}Position`]: config.getInitialPosition(
						Object.values(seedData),
						playerPositionRoom
					),
					[`${color}Scale`]: config.getInitialScale(
						Object.values(seedData),
						playerPositionRoom
					),
				}),
				{}
			),
		};

		set(updates);
	}, [seedData, playerPositionRoom, set]);

	// Monster initial position
	useEffect(() => {
		if (
			!Object.values(seedData)[playerPositionRoom] ||
			Object.values(seedData)[playerPositionRoom]?.type === 'empty'
		)
			return;

		const monsterPosition = controls.monsterInitialPosition.some((v) => v !== 0)
			? controls.monsterInitialPosition
			: MONSTER_CONFIG.getInitialPosition(
					Object.values(seedData),
					playerPositionRoom
			  );

		const newPosition = getMonsterInitialPosition(
			playerPositionRoom,
			roomTotal,
			position,
			monsterPosition
		);

		if (Object.values(seedData)[playerPositionRoom]?.type === 'empty') {
			newPosition[1] = 10;
		}

		setMonsterPosition([newPosition[0], newPosition[1], newPosition[2]]);
		setMonsterRotation([
			controls.monsterInitialRotation[0] *
				(playerPositionRoom >= roomTotal / 2 ? -1 : 1),
			controls.monsterInitialRotation[1] +
				(playerPositionRoom >= roomTotal / 2 ? Math.PI : 0),
			controls.monsterInitialRotation[2] +
				(playerPositionRoom >= roomTotal / 2 ? 0 : 0),
		]);
		playAnimation(Object.values(seedData)[playerPositionRoom].animation);
	}, [
		playAnimation,
		playerPositionRoom,
		seedData,
		setMonsterPosition,
		setMonsterRotation,
		setMonsterState,
		roomTotal,
		position,
		controls,
	]);

	// Box3 generation effect
	useEffect(() => {
		if (
			!Object.values(seedData)[playerPositionRoom] ||
			Object.values(seedData)[playerPositionRoom]?.type === 'empty'
		)
			return undefined;

		const isFacingRoom = playerPositionRoom >= roomTotal / 2;

		const getBox3 = (pos, scale) => {
			const min = new THREE.Vector3(
				position[0] + pos[0] - 0.5 * scale[0],
				position[1] + pos[1] - 0.5 * scale[1],
				position[2] + pos[2] - 0.5 * scale[2]
			);

			const max = new THREE.Vector3(
				position[0] + pos[0] + 0.5 * scale[0],
				position[1] + pos[1] + 0.5 * scale[1],
				position[2] + pos[2] + 0.5 * scale[2]
			);

			if (isFacingRoom) {
				min.x = -min.x;
				max.x = -max.x;
				min.z = -min.z;
				max.z = -max.z;
				if (min.x > max.x) [min.x, max.x] = [max.x, min.x];
				if (min.z > max.z) [min.z, max.z] = [max.z, min.z];
			}

			return new THREE.Box3(min, max);
		};

		Object.keys(BOXES_CONFIG).forEach((color) => {
			const boxPosition = controls[`${color}Position`].some((v) => v !== 0)
				? controls[`${color}Position`]
				: BOXES_CONFIG[color].getInitialPosition(
						Object.values(seedData),
						playerPositionRoom
				  );

			const boxScale = controls[`${color}Scale`].some((v) => v !== 0)
				? controls[`${color}Scale`]
				: BOXES_CONFIG[color].getInitialScale(
						Object.values(seedData),
						playerPositionRoom
				  );

			boxRefs[color].current = getBox3(boxPosition, boxScale);
		});
	}, [seedData, position, playerPositionRoom, roomTotal, controls, boxRefs]);

	const refs = Object.entries(BOXES_CONFIG).reduce(
		(acc, [color, config]) => ({
			...acc,
			[config.ref]: boxRefs[color],
		}),
		{}
	);

	return (
		<>
			<TriggersConditions {...refs} position={position} />
			{controls.visible && (
				<group
					rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}
					visible={!seedData[playerPositionRoom]?.type === 'empty'}
				>
					{Object.entries(BOXES_CONFIG).map(([color]) => (
						<mesh
							key={color}
							geometry={boxGeometry}
							position={[
								position[0] + controls[`${color}Position`][0],
								position[1] + controls[`${color}Position`][1],
								position[2] + controls[`${color}Position`][2],
							]}
							scale={controls[`${color}Scale`]}
						>
							<meshBasicMaterial
								color={color}
								transparent={true}
								opacity={0.25}
							/>
						</mesh>
					))}
				</group>
			)}
		</>
	);
}