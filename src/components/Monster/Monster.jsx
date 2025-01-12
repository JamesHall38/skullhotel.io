import { useRef, useEffect, useCallback, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Blood from './Blood';
import * as THREE from 'three';
import Animations from './Animations';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import { findPath } from './pathfinding';
import useDoor from '../../hooks/useDoor';
import useHiding from '../../hooks/useHiding';

const BASE_SPEED = 5;
const CHASE_SPEED = 0.5;
const NEXT_POINT_THRESHOLD = 0.5;
const MIN_DISTANCE_FOR_RECALCULATION = 2;
const ATTACK_DISTANCE = 0.8;

function lerpCameraLookAt(camera, targetPosition, lerpFactor) {
	const targetQuaternion = new THREE.Quaternion();
	const cameraDirection = new THREE.Vector3();

	cameraDirection.subVectors(targetPosition, camera.position).normalize();
	targetQuaternion.setFromUnitVectors(
		new THREE.Vector3(0, 0, -1),
		cameraDirection
	);

	camera.quaternion.slerp(targetQuaternion, lerpFactor);
}

const Monster = (props) => {
	const group = useRef();
	const jumpScareSoundRef = useRef(new Audio('/sounds/jump_scare.ogg'));
	const [hasPlayedJumpScare, setHasPlayedJumpScare] = useState(false);
	const { nodes, materials, animations } = useGLTF('/models/monster.glb');
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomNumber = useGame((state) => state.roomNumber);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const animationName = useMonster((state) => state.animationName);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);
	const setJumpScare = useGame((state) => state.setJumpScare);
	const jumpScare = useGame((state) => state.jumpScare);
	const deaths = useGame((state) => state.deaths);

	const roomDoors = useDoor((state) => state.roomDoor);
	const nightstandDoor = useDoor((state) => state.nightStand);
	const deskDoor = useDoor((state) => state.desk);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);

	const setRoomDoor = useDoor((state) => state.setRoomDoor);
	const setBathroomDoors = useDoor((state) => state.setBathroomDoors);
	const [currentPath, setCurrentPath] = useState(null);
	const [pathfindingFailures, setPathfindingFailures] = useState(0);
	const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
	const [nextTargetIndex, setNextTargetIndex] = useState(0);
	const MAX_PATHFINDING_FAILURES = 3;
	const headBoneRef = useRef();
	const lastTargetRef = useRef({ x: 0, z: 0 });
	const [isWaiting, setIsWaiting] = useState(false);

	useEffect(() => {
		const jumpScareSound = jumpScareSoundRef.current;
		jumpScareSound.volume = 1;
		jumpScareSound.loop = false;

		return () => {
			jumpScareSound.pause();
			jumpScareSound.currentTime = 0;
		};
	}, []);

	useEffect(() => {
		setHasPlayedJumpScare(false);
	}, [deaths]);

	const lookAtCamera = useCallback((camera) => {
		const targetPosition = new THREE.Vector3(
			camera.position.x,
			0,
			camera.position.z
		);
		group.current.lookAt(
			targetPosition.x,
			group.current.position.y,
			targetPosition.z
		);
	}, []);

	const runAtCamera = useCallback(
		(camera, delta, mode = 'run') => {
			const speed = mode === 'chase' ? CHASE_SPEED : BASE_SPEED;
			const targetPosition = new THREE.Vector3(
				camera.position.x,
				group.current.position.y,
				camera.position.z
			);

			const isMonsterNearHallway = Math.abs(group.current.position.z) < 6.5;
			const isInHallway = camera.position.z < 2;
			const currentRoomDoorState = roomDoors[playerPositionRoom];
			const isDoorOpen = currentRoomDoorState;
			const isRunningRoom =
				Object.keys(seedData)[playerPositionRoom] === 'runningWindowToDoor' ||
				Object.keys(seedData)[playerPositionRoom] ===
					'runningWindowCurtainToBed';

			if (
				mode === 'chase' &&
				isMonsterNearHallway &&
				isInHallway &&
				isDoorOpen &&
				isRunningRoom
			) {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');
				return;
			}

			const distanceToCamera =
				group.current.position.distanceTo(targetPosition);

			if (distanceToCamera <= ATTACK_DISTANCE) {
				if (!jumpScare) {
					setJumpScare(true);
				}
				playAnimation('Attack');
				setAnimationSpeed(1);

				if (!hasPlayedJumpScare) {
					jumpScareSoundRef.current.currentTime = 0;
					jumpScareSoundRef.current.play();
					setHasPlayedJumpScare(true);
				}

				const direction = new THREE.Vector3();
				direction
					.subVectors(group.current.position, targetPosition)
					.normalize();

				const distanceToMove = (ATTACK_DISTANCE - distanceToCamera) * delta;
				group.current.position.x += direction.x * distanceToMove;
				group.current.position.y = 0;
				group.current.position.z += direction.z * distanceToMove;

				const targetLookAtPosition = new THREE.Vector3(
					group.current.position.x,
					group.current.position.y + 1.42,
					group.current.position.z
				);

				const lerpFactor = 0.1;
				lerpCameraLookAt(camera, targetLookAtPosition, lerpFactor);

				group.current.lookAt(
					targetPosition.x,
					group.current.position.y,
					targetPosition.z
				);
			} else {
				if (jumpScare) {
					setJumpScare(false);
				}

				if (monsterState !== 'chase') {
					if (animationName !== 'Run') {
						playAnimation('Run');
					}
				} else {
					if (animationName !== 'Walk') {
						playAnimation('Walk');
					}
				}

				if (mode === 'run') {
					const offsetX = 600;
					const offsetZ = 150;

					const monsterX = group.current.position.x * 10 + offsetX;
					const monsterZ = group.current.position.z * 10 + offsetZ;
					const targetX = camera.position.x * 10 + offsetX;
					const targetZ = camera.position.z * 10 + offsetZ;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

					if (!currentPath || distanceMoved > MIN_DISTANCE_FOR_RECALCULATION) {
						const newPath = findPath(monsterX, monsterZ, targetX, targetZ);
						if (newPath) {
							setCurrentPath(newPath);
							lastTargetRef.current = { x: targetX, z: targetZ };
							setPathfindingFailures(0);
						} else {
							setPathfindingFailures((prevFailures) => prevFailures + 1);
							if (pathfindingFailures >= MAX_PATHFINDING_FAILURES) {
								console.warn('Too many pathfinding failures, aborting');
								setCurrentPath(null);
								setPathfindingFailures(0);
							}
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							(nextPoint.x - offsetX) / 10 - group.current.position.x,
							0,
							(nextPoint.z - offsetZ) / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;

						group.current.position.add(direction.multiplyScalar(moveSpeed));

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(
								(nextPoint.x - offsetX) / 10 - group.current.position.x,
								2
							) +
								Math.pow(
									(nextPoint.z - offsetZ) / 10 - group.current.position.z,
									2
								)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							setCurrentPath(currentPath.slice(1));
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						group.current.position.add(direction.multiplyScalar(moveSpeed));

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				} else {
					const offsetX = 600;
					const offsetZ = 150;

					const monsterX = group.current.position.x * 10 + offsetX;
					const monsterZ = group.current.position.z * 10 + offsetZ;
					const targetX = camera.position.x * 10 + offsetX;
					const targetZ = camera.position.z * 10 + offsetZ;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

					if (!currentPath || distanceMoved > MIN_DISTANCE_FOR_RECALCULATION) {
						const newPath = findPath(monsterX, monsterZ, targetX, targetZ);
						if (newPath) {
							setCurrentPath(newPath);
							lastTargetRef.current = { x: targetX, z: targetZ };
							setPathfindingFailures(0);
						} else {
							setPathfindingFailures((prevFailures) => prevFailures + 1);
							if (pathfindingFailures >= MAX_PATHFINDING_FAILURES) {
								console.warn('Too many pathfinding failures, aborting');
								setCurrentPath(null);
								setPathfindingFailures(0);
							}
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							(nextPoint.x - offsetX) / 10 - group.current.position.x,
							0,
							(nextPoint.z - offsetZ) / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;

						group.current.position.add(direction.multiplyScalar(moveSpeed));

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(
								(nextPoint.x - offsetX) / 10 - group.current.position.x,
								2
							) +
								Math.pow(
									(nextPoint.z - offsetZ) / 10 - group.current.position.z,
									2
								)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							setCurrentPath(currentPath.slice(1));
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						group.current.position.add(direction.multiplyScalar(moveSpeed));

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				}
			}
		},
		[
			playAnimation,
			jumpScare,
			currentPath,
			setAnimationSpeed,
			monsterState,
			lookAtCamera,
			pathfindingFailures,
			setJumpScare,
			hasPlayedJumpScare,
			animationName,
			roomDoors,
			playerPositionRoom,
			seedData,
			setMonsterState,
			setShakeIntensity,
		]
	);

	useEffect(() => {
		if (nodes.Mesh.skeleton) {
			const headBone = nodes.Mesh.skeleton.bones.find(
				(bone) => bone.name === 'mixamorigHead'
			);

			if (headBone) {
				headBoneRef.current = headBone;
			}
		}
	}, [nodes]);

	useEffect(() => {
		if (monsterState === 'leaving') {
			setCurrentTargetIndex(0);
			setNextTargetIndex(1);
		}
	}, [monsterState]);

	useFrame(({ camera, clock }) => {
		if (
			headBoneRef.current &&
			monsterState !== 'run' &&
			monsterState !== 'chase' &&
			monsterState !== 'leaving' &&
			monsterState !== 'facingCamera'
		) {
			const headOffset =
				Object.values(seedData)[playerPositionRoom]?.headOffset || 0;
			const headPosition = new THREE.Vector3();

			headBoneRef.current.getWorldPosition(headPosition);
			const targetPosition = new THREE.Vector3();
			targetPosition.copy(camera.position);
			const lookAtVector = new THREE.Vector3();
			lookAtVector.subVectors(targetPosition, headPosition).normalize();

			const isBottomRow =
				playerPositionRoom >= Math.floor(Object.keys(seedData).length / 2);

			const targetAngle =
				Math.atan2(lookAtVector.x, lookAtVector.z) -
				headOffset +
				(isBottomRow ? Math.PI : 0);
			const currentAngle = headBoneRef.current.rotation.y;

			const angleDiff = THREE.MathUtils.degToRad(
				(((THREE.MathUtils.radToDeg(targetAngle - currentAngle) % 360) + 540) %
					360) -
					180
			);

			headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
				currentAngle,
				currentAngle + angleDiff,
				0.1
			);
		}

		if (monsterState === 'facingCamera') {
			lookAtCamera(camera);
			if (
				Object.values(seedData)[playerPositionRoom]?.monsterInitialRotation?.[0]
			) {
				group.current.rotation.x = 2.7;
				group.current.rotation.y = group.current.rotation.y / 1.5 + 0.2;
				group.current.rotation.z = 0;
			}
		} else if (monsterState === 'run' || monsterState === 'chase') {
			runAtCamera(camera, clock.getDelta() * 100, monsterState);
		} else if (monsterState === 'leaving') {
			let leavingPath;
			const hideSpot = useHiding.getState().hideSpot;

			if (
				(hideSpot === 'nightstand' && !nightstandDoor) ||
				(hideSpot === 'desk' && !deskDoor)
			) {
				leavingPath = [
					new THREE.Vector3(-1, 0, 12),
					new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(2, 0, 0),
				];
			} else if (hideSpot === 'roomCurtain' && !roomCurtain) {
				leavingPath = [new THREE.Vector3(2, 0, 0)];
			} else if (hideSpot === 'bathroomCurtain' && !bathroomCurtain) {
				leavingPath = [
					new THREE.Vector3(-1, 0, 3.9),
					new THREE.Vector3(-1.01, 0, 0),
					new THREE.Vector3(-2, 0, 0),
				];
			} else {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');
				return;
			}

			const CORRIDOR_LENGTH = 5.95;
			let roomX;
			if (playerPositionRoom >= roomNumber / 2) {
				roomX = -(playerPositionRoom - roomNumber / 2) * CORRIDOR_LENGTH;
			} else {
				roomX = -playerPositionRoom * CORRIDOR_LENGTH;
			}
			const roomPosition = new THREE.Vector3(roomX, 0, 0);

			const absoluteLeavingPath = leavingPath.map((relativePos) =>
				relativePos.add(roomPosition)
			);

			const targetPos = absoluteLeavingPath[currentTargetIndex];

			if (targetPos) {
				if (group.current.position.distanceTo(targetPos) < 0.1) {
					if (hideSpot === 'bathroomCurtain' && currentTargetIndex === 0) {
						setAnimationMixSpeed(1);
						playAnimation('Idle');

						const targetRotation = Math.atan2(
							camera.position.x - group.current.position.x,
							camera.position.z - group.current.position.z
						);
						const rotateSpeed = 80; // slower rotation
						group.current.rotation.y = THREE.MathUtils.lerp(
							group.current.rotation.y,
							targetRotation,
							clock.getDelta() * rotateSpeed
						);

						const currentRoom = playerPositionRoom;
						setBathroomDoors(currentRoom, true);

						setIsWaiting(true);
						setTimeout(() => {
							setIsWaiting(false);
							if (nextTargetIndex < leavingPath.length - 1) {
								setCurrentTargetIndex(nextTargetIndex);
							}
						}, 4000);
					} else {
						if (nextTargetIndex < leavingPath.length - 1) {
							setCurrentTargetIndex(nextTargetIndex);
						}
						if (
							currentTargetIndex ===
							leavingPath.length -
								1 -
								(nextTargetIndex < leavingPath.length - 1 ||
								hideSpot === 'roomCurtain'
									? 0
									: 1)
						) {
							setRoomDoor(playerPositionRoom, false);

							group.current.position.y = 10;
							setMonsterPosition([
								group.current.position.x,
								10,
								group.current.position.z,
							]);

							setCurrentTargetIndex(0);
							setNextTargetIndex(1);

							setMonsterState('hiding');
							playAnimation('Idle');
						}
					}

					if (nextTargetIndex < leavingPath.length - 1) {
						setNextTargetIndex(nextTargetIndex + 1);
					}
				}

				if (!isWaiting && targetPos) {
					const delta = clock.getDelta() * 100;
					const speed = 0.5;

					const direction = new THREE.Vector3(
						targetPos.x - group.current.position.x,
						0,
						targetPos.z - group.current.position.z
					).normalize();

					const moveAmount = direction.multiplyScalar(speed * delta);
					group.current.position.add(moveAmount);

					setMonsterPosition([
						group.current.position.x,
						group.current.position.y,
						group.current.position.z,
					]);

					const targetRotation = Math.atan2(direction.x, direction.z);
					const rotationSpeed = (Math.PI * delta * speed) / 2;
					group.current.rotation.y = THREE.MathUtils.lerp(
						group.current.rotation.y,
						targetRotation,
						rotationSpeed
					);
				}
			}
		}
	});

	return (
		<group>
			<group scale={1.1} position={monsterPosition}>
				{Object.keys(seedData)[playerPositionRoom] === 'bloodOnBath' ||
					(Object.keys(seedData)[playerPositionRoom] === 'bloodOnDoor' && (
						<Blood />
					))}
			</group>
			<group
				position={monsterPosition}
				rotation={monsterRotation}
				scale={1.1}
				ref={group}
				{...props}
				dispose={null}
			>
				<Animations group={group} animations={animations} />
				<group name="Scene">
					<group name="Armature" scale={0.01}>
						<group name="Ch30" rotation={[Math.PI / 2, 0, 0]}>
							<primitive object={nodes.mixamorigHips} />
							<skinnedMesh
								name="Mesh"
								geometry={nodes.Mesh.geometry}
								material={materials.Ch30_Body1}
								skeleton={nodes.Mesh.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_1"
								geometry={nodes.Mesh_1.geometry}
								material={materials.Ch30_Body}
								skeleton={nodes.Mesh_1.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_2"
								geometry={nodes.Mesh_2.geometry}
								material={materials['Material.001']}
								skeleton={nodes.Mesh_2.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_3"
								geometry={nodes.Mesh_3.geometry}
								material={materials.Material}
								skeleton={nodes.Mesh_3.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_4"
								geometry={nodes.Mesh_4.geometry}
								material={materials['Material.002']}
								skeleton={nodes.Mesh_4.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_5"
								geometry={nodes.Mesh_5.geometry}
								material={materials['Material.011']}
								skeleton={nodes.Mesh_5.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							/>
							<skinnedMesh
								name="Mesh_6"
								geometry={nodes.Mesh_6.geometry}
								skeleton={nodes.Mesh_6.skeleton}
								frustumCulled={false}
								castShadow
								receiveShadow
							>
								<meshBasicMaterial color="black" />
							</skinnedMesh>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

useGLTF.preload('/models/monster.glb');

export default Monster;
