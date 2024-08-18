import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';

const maxShakeIntensity = 10;
const cameraDirection = new THREE.Vector3();
const lookingDown = new THREE.Vector3(0, -1, 0);
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];

const visible = false;

function getAdjustedPosition(initialPosition, isFacingRoom) {
	if (!isFacingRoom) return initialPosition;
	return [-initialPosition[0], initialPosition[1], -initialPosition[2]];
}

export default function CameraShaking() {
	const dangerZoneBox = useRef();
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const cameraShakingWhenLookingAtMonster = useGame(
		(state) => state.cameraShakingWhenLookingAtMonster
	);

	// Monster
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const playAnimation = useMonster((state) => state.playAnimation);

	// Doors
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const roomDoor = useDoor((state) => state.roomDoor);
	const bathroomDoor = useDoor((state) => state.bathroomDoor);
	const desk = useDoor((state) => state.desk);
	const nightStand = useDoor((state) => state.nightStand);

	let shakeStartTime = null;
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

	const jumpScareSoundRef = useRef(new Audio('/sounds/jumpScareAmbiance.ogg'));

	useEffect(() => {
		jumpScareSoundRef.current.loop = true;
		jumpScareSoundRef.current.volume = 0;
		jumpScareSoundRef.current.play();
	}, []);

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

		dangerZoneBox.current = getBox3(
			seedData[playerPositionRoom].dangerZonePosition,
			seedData[playerPositionRoom].dangerZoneScale || [0, 0, 0]
		);
	}, [position, playerPositionRoom, roomTotal, seedData]);

	const triangleWave = (t, frequency) => {
		const period = 1 / frequency;
		const phase = t % period;
		return 2 * Math.abs(phase / period - 0.5) - 0.5;
	};

	useFrame(({ clock, camera, raycaster }) => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return null;
		camera.getWorldDirection(cameraDirection);

		raycaster.set(camera.position, lookingDown);

		if (
			cameraShakingWhenLookingAtMonster ||
			(dangerZoneBox.current &&
				raycaster.ray.intersectsBox(dangerZoneBox.current) &&
				(type === 1 && number === 0 ? bathroomDoor : true)) ||
			(type === 3 &&
				((seedData[playerPositionRoom].trigger?.window && roomCurtain) ||
					(seedData[playerPositionRoom].trigger?.bath && bathroomCurtain) ||
					(seedData[playerPositionRoom].trigger?.door &&
						roomDoor[playerPositionRoom]) ||
					(seedData[playerPositionRoom].trigger?.bathroom && bathroomDoor) ||
					(seedData[playerPositionRoom].trigger?.desk && desk) ||
					(seedData[playerPositionRoom].trigger?.bed && nightStand)))
		) {
			const elapsedTime = clock.getElapsedTime();
			camera.getWorldDirection(cameraDirection);
			const targetDirection = new THREE.Vector3(...monsterPosition);
			targetDirection.sub(camera.position).normalize();
			const dotProduct = cameraDirection.dot(targetDirection);
			const shakeIntensity = Math.max(
				0.01,
				Math.pow(Math.max(0, dotProduct), 2) * maxShakeIntensity
			);

			if (shakeIntensity > 0) {
				const shakeX =
					triangleWave(elapsedTime * shakeIntensity, 1) * 0.02 * shakeIntensity;
				const shakeY =
					triangleWave(elapsedTime * shakeIntensity, 1.33) *
					0.02 *
					shakeIntensity;

				camera.position.x += shakeX;
				camera.position.y += shakeY;
			}

			jumpScareSoundRef.current.volume = Math.min(
				shakeIntensity / maxShakeIntensity,
				1
			);

			if (shakeIntensity > 1) {
				if (shakeStartTime === null) {
					shakeStartTime = elapsedTime;
				} else if (elapsedTime - shakeStartTime >= 3) {
					playAnimation('Run');
					setMonsterState('run');
					shakeStartTime = null;
				}
			} else {
				shakeStartTime = null;
			}
		} else {
			jumpScareSoundRef.current.volume = Math.max(
				jumpScareSoundRef.current.volume - 0.01,
				0
			);
		}
	});

	return (
		<group rotation={[0, playerPositionRoom >= roomTotal / 2 ? Math.PI : 0, 0]}>
			<mesh
				geometry={boxGeometry}
				position={[
					position[0] +
						(seedData[playerPositionRoom]?.dangerZonePosition?.[0] || 0),
					position[1] +
						(seedData[playerPositionRoom]?.dangerZonePosition?.[1] || 0),
					position[2] +
						(seedData[playerPositionRoom]?.dangerZonePosition?.[2] || 0),
				]}
				scale={seedData[playerPositionRoom]?.dangerZoneScale || [0, 0, 0]}
			>
				<meshBasicMaterial
					color="green"
					visible={visible}
					transparent={true}
					opacity={0.25}
				/>
			</mesh>
		</group>
	);
}
