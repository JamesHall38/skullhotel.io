import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useGLTF, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Blood from './Blood';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';
import Animations from './Animations';
import { regenerateData } from '../../utils/config';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
}

const CORRIDORLENGTH = 5.95;
const INTENSITY = 4;
const offset = [3, 0, 6.2];

const Monster = (props) => {
	const group = useRef();
	const { nodes, materials, animations } = useGLTF('/models/monster.glb');
	const resetTriggered = useRef(false);
	const [isVisible, setIsVisible] = useState(true);
	const breathingSoundRef = useRef();

	// Game state
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const roomDoor = useDoor((state) => state.roomDoor);

	// Animation
	const playAnimation = useMonster((state) => state.playAnimation);
	const animationName = useMonster((state) => state.animationName);

	// Monster state
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);

	const type = seedData[playerPositionRoom]?.type;
	const number = seedData[playerPositionRoom]?.number;

	const jumpScareSoundRef = useRef(new Audio('/sounds/jumpScare.ogg'));

	const position = useMemo(() => {
		if (playerPositionRoom >= roomTotal / 2)
			return [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		else
			return [
				offset[0] - 5.91 - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
	}, [playerPositionRoom, roomTotal]);

	// Position
	useEffect(() => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return;

		const isFacingRoom = playerPositionRoom >= roomTotal / 2;
		const initialPosition = [
			position[0] +
				(seedData[playerPositionRoom].monsterInitialPosition?.[0] || 0),
			position[1] +
				(seedData[playerPositionRoom].monsterInitialPosition?.[1] || 0),
			position[2] +
				(seedData[playerPositionRoom].monsterInitialPosition?.[2] || 0),
		];

		const getAdjustedPosition = (initialPosition, isFacingRoom) => {
			if (!isFacingRoom) return initialPosition;
			return [
				-initialPosition[0] -
					CORRIDORLENGTH * 2 * (playerPositionRoom - roomTotal / 2) -
					0.1,
				initialPosition[1],
				-initialPosition[2],
			];
		};

		const newPosition = getAdjustedPosition(initialPosition, isFacingRoom);

		setMonsterState(
			[0, 1, 5].includes(type)
				? seedData[playerPositionRoom].trigger?.frozen
					? 'frozen'
					: 'hidden'
				: 'frozen'
		);
		setMonsterPosition([newPosition[0], newPosition[1], newPosition[2]]);
		setMonsterRotation([
			(seedData[playerPositionRoom].monsterInitialRotation?.[0] || 0) *
				(playerPositionRoom >= roomTotal / 2 ? -1 : 1),
			(seedData[playerPositionRoom].monsterInitialRotation?.[1] || 0) +
				(playerPositionRoom >= roomTotal / 2 ? Math.PI : 0),
			(seedData[playerPositionRoom].monsterInitialRotation?.[2] || 0) +
				(playerPositionRoom >= roomTotal / 2 ? 0 : 0),
		]);
		playAnimation(seedData[playerPositionRoom].animation);
	}, [
		seedData,
		playAnimation,
		position,
		setMonsterPosition,
		setMonsterRotation,
		setMonsterState,
		type,
		roomTotal,
		playerPositionRoom,
	]);

	const lookAtCamera = useCallback((camera) => {
		const targetPosition = new THREE.Vector3(
			camera.position.x,
			group.current.position.y,
			camera.position.z
		);
		group.current.lookAt(
			targetPosition.x,
			group.current.position.y,
			targetPosition.z
		);
	}, []);

	const runAtCamera = useCallback(
		(camera) => {
			if (
				type !== 5 ||
				(number !== 2
					? (roomDoor[playerPositionRoom] &&
							Math.abs(camera.position.z) < 1.4) ||
					  Math.abs(camera.position.z) > 1.4
					: (roomDoor[playerPositionRoom] &&
							Math.abs(camera.position.z) > 4.3) ||
					  group.current.position.x - position[0] < 8)
			) {
				const groupPos = group.current.position;
				const camPos = new THREE.Vector3(
					camera.position.x,
					groupPos.y,
					camera.position.z
				);

				group.current.lookAt(camPos);

				const direction = new THREE.Vector3()
					.subVectors(camPos, groupPos)
					.normalize();
				const distance = groupPos.distanceTo(camPos);
				const minDistance = 0.75;

				if (distance > minDistance) {
					const speed = monsterState === 'run' ? 0.05 : 0.01;
					group.current.position.add(direction.multiplyScalar(speed));
				} else if (distance <= minDistance) {
					group.current.position.add(direction.multiplyScalar(-0.02));
				}

				if (monsterState === 'crawl') {
					const targetY =
						Math.abs(group.current.position.z) > 5 &&
						Math.abs(group.current.position.z) < 8
							? 2.4
							: 1.65;

					group.current.position.y = THREE.MathUtils.lerp(
						group.current.position.y,
						targetY,
						0.05
					);
				}

				if (
					(monsterState === 'chase' || monsterState === 'crawl') &&
					(number === 2 || number === 3 || number === 4)
				) {
					const monsterIsBathroomSide = Math.abs(group.current.position.z) < 5;
					const monsterIsCorridorSide =
						playerPositionRoom < roomTotal / 2
							? Math.abs(group.current.position.x) - Math.abs(position[0]) <
							  -1.8
							: Math.abs(group.current.position.x) - Math.abs(position[0]) >
							  -4.2;
					const monsterIsWindowSide = Math.abs(group.current.position.z) > 8;
					const monsterIsSkullSide =
						playerPositionRoom < roomTotal / 2
							? Math.abs(group.current.position.x) - Math.abs(position[0]) > -1
							: Math.abs(group.current.position.x) - Math.abs(position[0]) <
							  -4.8;

					if (monsterIsWindowSide && monsterIsSkullSide) {
						group.current.position.z =
							playerPositionRoom > roomTotal / 2 ? -9 : 9;
					}

					if (monsterIsBathroomSide && !monsterIsCorridorSide) {
						group.current.position.z =
							playerPositionRoom > roomTotal / 2 ? -5 : 5;
					}
				}
			}
		},
		[
			type,
			number,
			roomDoor,
			playerPositionRoom,
			position,
			monsterState,
			roomTotal,
		]
	);

	const hiddenState = useCallback((camera) => {
		const targetPosition = new THREE.Vector3(
			camera.position.x,
			group.current.position.y,
			camera.position.z
		);

		group.current.lookAt(
			targetPosition.x,
			group.current.position.y,
			targetPosition.z
		);
	}, []);

	const runState = useCallback(
		(camera) => {
			const monsterPosition = new THREE.Vector3().setFromMatrixPosition(
				group.current.matrixWorld
			);
			const distance = camera.position.distanceTo(monsterPosition);

			if (distance > 1.36) {
				lookAtCamera(camera);
				runAtCamera(camera);
			} else {
				const direction = new THREE.Vector3()
					.subVectors(group.current.position, camera.position)
					.normalize();

				const targetPosition = new THREE.Vector3().addVectors(
					camera.position,
					direction.multiplyScalar(1.36)
				);

				group.current.position.set(
					targetPosition.x,
					group.current.position.y,
					targetPosition.z
				);

				if (!resetTriggered.current) {
					setTimeout(() => {
						regenerateData();
						resetGame();
					}, 1200);
				}
			}

			if (distance < 2.5) {
				setShakeIntensity(INTENSITY);
				setMonsterState('run');
				camera.lookAt(
					monsterPosition.x,
					monsterPosition.y + 1.15,
					monsterPosition.z
				);

				group.current.position.y = camera.position.y - 1.15;
				group.current.rotation.x = 0;
				group.current.rotation.z = 0;
				lookAtCamera(camera);

				if (animationName !== 'Attack') {
					jumpScareSoundRef.current.play();
					playAnimation('Attack');
				}
			} else {
				resetTriggered.current = false;
			}
		},
		[
			lookAtCamera,
			runAtCamera,
			setShakeIntensity,
			setMonsterState,
			animationName,
			playAnimation,
		]
	);

	const handleState = useCallback(
		(camera) => {
			switch (monsterState) {
				case 'hidden':
					hiddenState(camera);
					break;
				case 'frozen':
					if (type === 1 && (number === 10 || number === 11)) {
					} else {
						if (
							type === 3 &&
							(Math.abs(camera.position.z) > 1.4 || number === 4)
						) {
							lookAtCamera(camera);
						} else if (type !== 2 && type !== 4) {
							group.current.lookAt(
								group.current.position.x,
								group.current.position.y,
								group.current.position.z +
									(playerPositionRoom > roomTotal / 2 ? -1 : 1)
							);
						}
					}
					break;
				case 'run':
				case 'chase':
				case 'crawl':
					runState(camera);
					break;
				default:
					break;
			}
		},
		[
			monsterState,
			lookAtCamera,
			runState,
			type,
			number,
			playerPositionRoom,
			roomTotal,
			hiddenState,
		]
	);

	const isFarFromTheDoor = type ? type !== 0 : false;
	useFrame(({ camera }) => {
		if (!group.current) return;
		setIsVisible(Math.abs(camera.position.z) >= 1.55 || isFarFromTheDoor);
		handleState(camera);

		// Play or stop the breathing sound based on the room's sound trigger
		if (seedData[playerPositionRoom]?.sound) {
			if (breathingSoundRef.current && !breathingSoundRef.current.isPlaying) {
				breathingSoundRef.current.play();
			}
		} else {
			if (breathingSoundRef.current && breathingSoundRef.current.isPlaying) {
				breathingSoundRef.current.stop();
			}
		}
	});

	return (
		<group
			position={monsterPosition}
			rotation={monsterRotation}
			scale={1.1}
			ref={group}
			{...props}
			dispose={null}
			visible={isVisible}
		>
			<Animations group={group} animations={animations} />
			{type === 4 && (number === 0 || number === 1 || number === 2) && (
				<Blood />
			)}
			<group name="Scene">
				<group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
					<group name="Ch30">
						<skinnedMesh
							frustumCulled={false}
							castShadow
							receiveShadow
							name="Mesh"
							geometry={nodes.Mesh.geometry}
							material={materials.Ch30_Body1}
							skeleton={nodes.Mesh.skeleton}
						/>
						<skinnedMesh
							frustumCulled={false}
							castShadow
							receiveShadow
							name="Mesh_1"
							geometry={nodes.Mesh_1.geometry}
							material={materials.Ch30_Body}
							skeleton={nodes.Mesh_1.skeleton}
						/>
						<skinnedMesh
							frustumCulled={false}
							castShadow
							receiveShadow
							name="Mesh_2"
							geometry={nodes.Mesh_2.geometry}
							material={materials['Material.001']}
							skeleton={nodes.Mesh_2.skeleton}
						/>
					</group>
					<primitive object={nodes.mixamorigHips} />
				</group>
			</group>

			<PositionalAudio
				ref={breathingSoundRef}
				url="/sounds/breathing.ogg"
				loop={true}
				distance={0.5}
				refDistance={1}
				rolloffFactor={1}
				volume={1}
			/>
		</group>
	);
};

useGLTF.preload('/models/monster.glb');

export default Monster;
