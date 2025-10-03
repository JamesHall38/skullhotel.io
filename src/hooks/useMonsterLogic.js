import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useMonster from './useMonster';
import useGame from './useGame';
import useDoor from './useDoor';
import useHiding from './useHiding';
import useSimplePathfinding from './useSimplePathfinding';
import { getAudioInstance, areSoundsLoaded } from '../utils/audio';
import useGameplaySettings from './useGameplaySettings';
import useGamepadControls, { vibrateControllers } from './useGamepadControls';

const BASE_SPEED = 5;
const CHASE_SPEED_BASE = 1.5;
const CLAYMORE_CHASE_SPEED = 5;
const NEXT_POINT_THRESHOLD = 0.5;
const ATTACK_DISTANCE = 1.8;
const IDEAL_ATTACK_DISTANCE = 0.8;
const ATTACK_POSITION_LERP_SPEED = 0.15;
const MIN_SPEED_MULTIPLIER = 1;
const DISTANCE_REFERENCE = 4;
const SPEED_GROWTH_FACTOR = 2;
const MAX_SPEED_MULTIPLIER = 8;
const OFFSET_X = 304;
const OFFSET_Z = 150;
const BOTTOM_ROW_OFFSET_X = 77;
const BOTTOM_ROW_OFFSET_Z = 0;
const CORRIDOR_LENGTH = 5.95;
const offset = [8.83, 0, 6.2];

function lerpCameraLookAt(camera, targetPosition, lerpFactor) {
	const targetQuaternion = new THREE.Quaternion();
	const cameraDirection = new THREE.Vector3();

	cameraDirection.subVectors(targetPosition, camera.position);
	cameraDirection.y = 0;
	cameraDirection.normalize();

	targetQuaternion.setFromUnitVectors(
		new THREE.Vector3(0, 0, -1),
		cameraDirection
	);

	camera.quaternion.slerp(targetQuaternion, lerpFactor);
	camera.position.y = 1.5;
}

const calculateRoomOffsetX = (playerPositionRoom, roomCount) => {
	const isBottomRow = playerPositionRoom >= roomCount / 2;

	if (isBottomRow) {
		return (
			offset[0] -
			CORRIDOR_LENGTH -
			(playerPositionRoom - Math.floor(roomCount / 2)) * CORRIDOR_LENGTH -
			5.84
		);
	} else {
		return -(offset[0] - 5.91) - playerPositionRoom * CORRIDOR_LENGTH;
	}
};

const MONSTER_HEIGHT = {
	GROUND: 0,
	CEILING_LOW: 1.35,
	CEILING_HIGH: 2,
	CEILING_MID: 1.2,
	CEILING_IDLE_LOW: 1.68,
};

export default function useMonsterLogic() {
	const maxDirectPathFailures = 10;
	const useSimplePathfindingEnabled = true;

	const group = useRef();
	const jumpScareSoundRef = useRef(null);
	const [hasPlayedJumpScare, setHasPlayedJumpScare] = useState(false);
	const [hasTriggeredVibration, setHasTriggeredVibration] = useState(false);
	const [hasTriggeredDeathVibration, setHasTriggeredDeathVibration] =
		useState(false);
	const [soundsReady, setSoundsReady] = useState(false);
	const lastJumpScareTimeRef = useRef(0);
	const [directPathFailures, setDirectPathFailures] = useState(0);
	const lastChaseTimeRef = useRef(0);
	const lastFrameTimeRef = useRef(performance.now());
	const performanceDeltaRef = useRef(0);
	const headBoneRef = useRef();
	const lastTargetRef = useRef({ x: 0, z: 0 });
	const [isWaiting, setIsWaiting] = useState(false);
	const timeoutRef = useRef(null);
	const [usedForcedPathfinding, setUsedForcedPathfinding] = useState({});
	const [visitedWaypoints, setVisitedWaypoints] = useState({});
	const [currentPath, setCurrentPath] = useState(null);
	const pathfindingRequestRef = useRef(null);
	const [isPathfindingInProgress, setIsPathfindingInProgress] = useState(false);
	const lastPathfindingTimeRef = useRef(0);
	const PATHFINDING_INTERVAL = 500;

	useGamepadControls();

	const pathfindingSystem = useSimplePathfindingEnabled
		? useSimplePathfinding()
		: { findPath: null, isWorkerReady: false };
	const { findPath: findPathWorker, isWorkerReady } = pathfindingSystem;

	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const endAnimationPlaying = useGame((state) => state.endAnimationPlaying);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const setJumpScare = useGame((state) => state.setJumpScare);
	const jumpScare = useGame((state) => state.jumpScare);
	const deaths = useGame((state) => state.deaths);
	const setDisableControls = useGame((state) => state.setDisableControls);
	const isEndAnimationPlaying = useGame((state) => state.isEndAnimationPlaying);
	const setCustomDeathMessage = useGame((state) => state.setCustomDeathMessage);

	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const animationName = useMonster((state) => state.animationName);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);

	const roomDoors = useDoor((state) => state.roomDoor);
	const nightstandDoor = useDoor((state) => state.nightStand);
	const deskDoor = useDoor((state) => state.desk);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const setRoomDoor = useDoor((state) => state.setRoomDoor);
	const setBathroomDoors = useDoor((state) => state.setBathroomDoors);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				const sound = getAudioInstance('jumpScare');
				if (sound) {
					jumpScareSoundRef.current = sound;
					jumpScareSoundRef.current.volume = 1;
					jumpScareSoundRef.current.loop = false;
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (jumpScareSoundRef.current) {
				jumpScareSoundRef.current.pause();
				jumpScareSoundRef.current.currentTime = 0;
			}
		};
	}, []);

	useEffect(() => {
		setHasPlayedJumpScare(false);
		setHasTriggeredVibration(false);
		setHasTriggeredDeathVibration(false);
		setVisitedWaypoints({});
		lastJumpScareTimeRef.current = 0;
	}, [deaths]);

	useEffect(() => {
		if (group.current && headBoneRef.current) {
			headBoneRef.current.rotation.set(0, 0, 0);
			group.current.rotation.set(0, Math.PI, 0);
			group.current.position.set(0, 10, 0);
			setMonsterState('hidden');
			setMonsterPosition([0, 10, 0]);
			setMonsterRotation([0, Math.PI, 0]);
		}
	}, [deaths, setMonsterPosition, setMonsterRotation, setMonsterState]);

	useEffect(() => {
		setDirectPathFailures(0);
	}, [roomDoors]);

	useEffect(() => {
		setUsedForcedPathfinding({});
	}, [playerPositionRoom]);

	useEffect(() => {
		if (monsterState !== 'chase') {
			lastChaseTimeRef.current = 0;
		}
		setVisitedWaypoints({});
	}, [monsterState]);

	useEffect(() => {
		lastChaseTimeRef.current = 0;
	}, [playerPositionRoom]);

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

	const lastRealTimeRef = useRef(performance.now());

	const calculateFrameRateIndependentMovement = useCallback((speed, delta) => {
		const currentTime = performance.now();
		const realTimeDelta = Math.min(
			(currentTime - lastRealTimeRef.current) / 1000,
			0.1
		);
		lastRealTimeRef.current = currentTime;

		const moveDistance = speed * realTimeDelta;

		return moveDistance;
	}, []);

	const checkWallCrossing = useCallback(
		(
			currentPlayerX,
			currentPlayerZ,
			lastPlayerX,
			lastPlayerZ,
			playerPositionRoom,
			roomCount
		) => {
			const currentPlayerZAbs = Math.abs(currentPlayerZ);
			const lastPlayerZAbs = Math.abs(lastPlayerZ || 0);

			const isBottomRow = playerPositionRoom >= roomCount / 2;
			let roomIndex = 0;
			if (isBottomRow) {
				roomIndex = playerPositionRoom - Math.floor(roomCount / 2);
			} else {
				roomIndex = playerPositionRoom;
			}
			const roomOffsetX = calculateRoomOffsetX(playerPositionRoom, roomCount);

			const wallZPositions = [8, 4.4, 1.4];
			for (const wallZ of wallZPositions) {
				const wasBeforeWall = lastPlayerZAbs < wallZ;
				const isAfterWall = currentPlayerZAbs > wallZ;
				const wasBeyondWall = lastPlayerZAbs > wallZ;
				const isBeforeWall = currentPlayerZAbs < wallZ;

				if ((wasBeforeWall && isAfterWall) || (wasBeyondWall && isBeforeWall)) {
					return true;
				}
			}

			const playerInZone = currentPlayerZAbs < 4.2 || lastPlayerZAbs < 4.2;

			if (playerInZone) {
				const wallXPosition = -1.35 + roomOffsetX + 2.92;
				const wasBeforeWallX = (lastPlayerX || 0) < wallXPosition;
				const isAfterWallX = currentPlayerX > wallXPosition;
				const wasBeyondWallX = (lastPlayerX || 0) > wallXPosition;
				const isBeforeWallX = currentPlayerX < wallXPosition;

				if (
					(wasBeforeWallX && isAfterWallX) ||
					(wasBeyondWallX && isBeforeWallX)
				) {
					return true;
				}
			}

			return false;
		},
		[]
	);

	const checkAndHandleXWaypoint = useCallback(
		(waypoint, playerPositionRoom, roomCount) => {
			const isBottomRow = playerPositionRoom >= roomCount / 2;
			let roomIndex = 0;

			if (isBottomRow) {
				roomIndex = playerPositionRoom - Math.floor(roomCount / 2);
			} else {
				roomIndex = playerPositionRoom;
			}
			const roomOffsetX = calculateRoomOffsetX(playerPositionRoom, roomCount);

			const expectedXWaypointX =
				roomOffsetX + (isBottomRow ? 1.35 : -1.35) + 2.92;
			let expectedXWaypointZ = 3.7;
			if (isBottomRow) {
				expectedXWaypointZ = -expectedXWaypointZ;
			}

			const tolerance = 0.1;
			const isXWaypoint =
				Math.abs(waypoint.x - expectedXWaypointX) < tolerance &&
				Math.abs(waypoint.z - expectedXWaypointZ) < tolerance;

			if (isXWaypoint) {
				setBathroomDoors(playerPositionRoom, true);

				const waypointKey = `x_${expectedXWaypointX}_${expectedXWaypointZ}`;
				setVisitedWaypoints((prev) => ({
					...prev,
					[waypointKey]: true,
				}));
				return true;
			}

			return false;
		},
		[setBathroomDoors]
	);

	const requestPathfinding = useCallback(
		async (monsterX, monsterZ, targetX, targetZ) => {
			if (
				!useSimplePathfindingEnabled ||
				!isWorkerReady ||
				isPathfindingInProgress
			) {
				return null;
			}

			if (pathfindingRequestRef.current) {
				pathfindingRequestRef.current.cancelled = true;
			}

			const requestId = Date.now();
			pathfindingRequestRef.current = { id: requestId, cancelled: false };
			setIsPathfindingInProgress(true);

			try {
				const currentRoomData = Object.values(seedData)[playerPositionRoom];
				const isRaidMode =
					currentRoomData?.isRaid === true ||
					currentRoomData?.type === 'raid' ||
					(monsterState === 'run' && Math.abs(monsterZ) < 1.4);

				const path = await findPathWorker(
					monsterX,
					monsterZ,
					targetX,
					targetZ,
					playerPositionRoom,
					roomCount,
					visitedWaypoints,
					isRaidMode
				);

				if (
					pathfindingRequestRef.current?.id === requestId &&
					!pathfindingRequestRef.current.cancelled
				) {
					setIsPathfindingInProgress(false);
					return path;
				}

				return null;
			} catch (error) {
				console.error('Pathfinding error:', error);
				setIsPathfindingInProgress(false);
				return null;
			}
		},
		[
			useSimplePathfindingEnabled,
			isWorkerReady,
			isPathfindingInProgress,
			findPathWorker,
			playerPositionRoom,
			roomCount,
			visitedWaypoints,
			seedData,
			monsterState,
		]
	);

	const runAtCamera = useCallback(
		(camera, delta, mode = 'run') => {
			let baseSpeed;
			if (mode === 'chase') {
				if (lastChaseTimeRef.current === 0) {
					lastChaseTimeRef.current = Date.now();
				}
				const roomKey =
					Object.values(seedData)[playerPositionRoom]?.baseKey ||
					Object.keys(seedData)[playerPositionRoom];
				const isClaymoreDeskOrNightstand =
					roomKey === 'claymoreDesk' || roomKey === 'claymoreNightstand';
				const baseChaseSpeed = isClaymoreDeskOrNightstand
					? CLAYMORE_CHASE_SPEED
					: CHASE_SPEED_BASE;

				baseSpeed = baseChaseSpeed;
			} else {
				baseSpeed = BASE_SPEED;
			}

			const targetPosition = new THREE.Vector3(
				camera.position.x,
				group.current.position.y,
				camera.position.z
			);

			const distanceToCamera =
				group.current.position.distanceTo(targetPosition);
			const normalizedDistance = distanceToCamera / DISTANCE_REFERENCE;
			const distanceMultiplier = Math.min(
				Math.max(
					Math.pow(normalizedDistance, SPEED_GROWTH_FACTOR),
					MIN_SPEED_MULTIPLIER
				),
				MAX_SPEED_MULTIPLIER
			);

			const speed = baseSpeed;

			if (mode === 'chase') {
				setAnimationSpeed(2);
			} else {
				setAnimationSpeed(distanceMultiplier);
			}

			const isMonsterNearHallway = Math.abs(group.current.position.z) < 6.5;
			const isInHallway = camera.position.z < 2;
			const currentRoomDoorState = roomDoors[playerPositionRoom];
			const isDoorOpen = currentRoomDoorState;
			const isRunningRoom =
				Object.keys(seedData)[playerPositionRoom] === 'runningWindowToDoor' ||
				Object.keys(seedData)[playerPositionRoom] ===
					'runningWindowCurtainToBed';

			if (mode === 'chase' && Math.abs(group.current.position.z) < 2.3) {
				setMonsterState('run');
				playAnimation('Run');
				return;
			}

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

			if (distanceToCamera <= ATTACK_DISTANCE) {
				const currentTime = Date.now();
				const timeSinceLastJumpScare =
					currentTime - lastJumpScareTimeRef.current;

				if (!jumpScare && timeSinceLastJumpScare >= 10000) {
					// 10 seconds cooldown
					setJumpScare(true);
					lastJumpScareTimeRef.current = currentTime;

					const roomKey =
						Object.values(seedData)[playerPositionRoom]?.baseKey ||
						Object.keys(seedData)[playerPositionRoom];
					const isClaymoreDeskOrNightstand =
						roomKey === 'claymoreDesk' || roomKey === 'claymoreNightstand';

					if (mode === 'chase' && isClaymoreDeskOrNightstand) {
						setCustomDeathMessage('game.deathReasons.claymoreChase');
					}

					if (!hasTriggeredVibration) {
						vibrateControllers(1.0, 1500);
						setHasTriggeredVibration(true);
					}
				}
				playAnimation('Attack');
				setAnimationSpeed(1);

				if (
					!hasPlayedJumpScare &&
					soundsReady &&
					jumpScareSoundRef.current &&
					timeSinceLastJumpScare >= 10000
				) {
					jumpScareSoundRef.current.currentTime = 0;
					jumpScareSoundRef.current.play().catch(() => {});
					setHasPlayedJumpScare(true);
				}

				const direction = new THREE.Vector3();
				direction
					.subVectors(group.current.position, targetPosition)
					.normalize();

				const idealPosition = new THREE.Vector3();
				const directionToIdeal = direction.clone();
				idealPosition
					.copy(targetPosition)
					.add(directionToIdeal.multiplyScalar(IDEAL_ATTACK_DISTANCE));

				group.current.position.lerp(idealPosition, ATTACK_POSITION_LERP_SPEED);
				group.current.position.y = 0;

				const targetLookAtPosition = new THREE.Vector3(
					group.current.position.x,
					group.current.position.y + 1.42,
					group.current.position.z
				);

				const lerpFactor = 0.5;
				lerpCameraLookAt(camera, targetLookAtPosition, lerpFactor);
				setDisableControls(true);

				group.current.lookAt(
					targetPosition.x,
					group.current.position.y,
					targetPosition.z
				);
			} else {
				if (jumpScare) {
					setJumpScare(false);
				}
				if (animationName === 'Idle') {
					group.current.position.y = MONSTER_HEIGHT.GROUND;
				} else if (animationName === 'CeilingCrawlIdle') {
					const zPos = Math.abs(group.current.position.z);
					if (zPos >= 5 && zPos <= 7.5) {
						group.current.position.y = MONSTER_HEIGHT.CEILING_HIGH;
					} else {
						group.current.position.y = MONSTER_HEIGHT.CEILING_LOW;
					}
				}

				if (monsterState !== 'chase') {
					if (animationName !== 'Run') {
						playAnimation('Run');
					}
				} else {
					if (
						Object.values(seedData)[playerPositionRoom]?.ceiling &&
						animationName !== 'CeilingCrawl' &&
						animationName !== 'Walk'
					) {
						playAnimation('CeilingCrawl');
					} else if (
						animationName !== 'Walk' &&
						animationName !== 'CeilingCrawl'
					) {
						playAnimation('Walk');
					}

					if (monsterState === 'chase' && animationName === 'CeilingCrawl') {
						const zPos = Math.abs(group.current.position.z);
						if (zPos >= 5 && zPos <= 7.5) {
							group.current.position.y = THREE.MathUtils.lerp(
								group.current.position.y,
								MONSTER_HEIGHT.CEILING_HIGH,
								delta * 6
							);
						} else {
							group.current.position.y = THREE.MathUtils.lerp(
								group.current.position.y,
								MONSTER_HEIGHT.CEILING_LOW,
								delta * 6
							);
						}
					}
				}

				if (mode === 'run') {
					const monsterX = group.current.position.x;
					const monsterZ = group.current.position.z;
					const targetX = camera.position.x;
					const targetZ = camera.position.z;

					const currentTime = performance.now();
					const timeSinceLastPathfinding =
						currentTime - lastPathfindingTimeRef.current;

					const monsterPos = new THREE.Vector3(
						group.current.position.x,
						group.current.position.y + 1,
						group.current.position.z
					);

					const currentCameraQuaternion = camera.quaternion.clone();
					camera.lookAt(monsterPos);
					const targetQuaternion = camera.quaternion.clone();
					camera.quaternion.copy(currentCameraQuaternion);

					const lerpFactor = delta * 2;
					camera.quaternion.slerp(targetQuaternion, lerpFactor);

					if (directPathFailures >= maxDirectPathFailures) {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
						return;
					}

					const playerCrossedWall = checkWallCrossing(
						camera.position.x,
						camera.position.z,
						lastTargetRef.current.x,
						lastTargetRef.current.z,
						playerPositionRoom,
						roomCount
					);

					if (
						!currentPath ||
						timeSinceLastPathfinding > PATHFINDING_INTERVAL ||
						playerCrossedWall
					) {
						if (useSimplePathfindingEnabled) {
							lastTargetRef.current = { x: targetX, z: targetZ };
							lastPathfindingTimeRef.current = currentTime;

							requestPathfinding(monsterX, monsterZ, targetX, targetZ).then(
								(newPath) => {
									if (newPath) {
										setCurrentPath(newPath);
										setDirectPathFailures(0);
									} else {
										setDirectPathFailures((prevFailures) => prevFailures + 1);
										console.warn(
											`Pathfinding failure ${directPathFailures + 1}`
										);

										if (directPathFailures + 1 >= maxDirectPathFailures) {
											console.warn(
												'Switching to direct path mode until room change'
											);
										}
									}
								}
							);
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							nextPoint.x - group.current.position.x,
							0,
							nextPoint.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							group.current.position.x + direction.x,
							group.current.position.y,
							group.current.position.z + direction.z
						);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(nextPoint.x - group.current.position.x, 2) +
								Math.pow(nextPoint.z - group.current.position.z, 2)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							const isXWaypoint = checkAndHandleXWaypoint(
								nextPoint,
								playerPositionRoom,
								roomCount
							);
							const waypointType = isXWaypoint ? 'x' : 'z';
							const waypointKey = `${waypointType}_${nextPoint.x.toFixed(
								2
							)}_${nextPoint.z.toFixed(2)}`;
							setVisitedWaypoints((prev) => ({
								...prev,
								[waypointKey]: true,
							}));

							const isZ44Waypoint = Math.abs(Math.abs(nextPoint.z) - 4.4) < 0.1;
							const playerZAbs = Math.abs(camera.position.z);
							const playerInCriticalZone = playerZAbs > 1.4 && playerZAbs < 4.4;

							if (isZ44Waypoint && playerInCriticalZone) {
								const isBottomRow = playerPositionRoom >= roomCount / 2;
								let roomIndex = 0;
								if (isBottomRow) {
									roomIndex = playerPositionRoom - Math.floor(roomCount / 2);
								} else {
									roomIndex = playerPositionRoom;
								}
								const roomOffsetX = calculateRoomOffsetX(
									playerPositionRoom,
									roomCount
								);

								const wallX = -1.35 + roomOffsetX + 2.92;
								const playerInBathroom = isBottomRow
									? camera.position.x > wallX
									: camera.position.x < wallX;
								const monsterInBathroom = isBottomRow
									? group.current.position.x > wallX
									: group.current.position.x < wallX;
								const needsXWaypoint = playerInBathroom;

								if (needsXWaypoint) {
									let xWaypointX =
										roomOffsetX + (isBottomRow ? 1.35 : -1.35) + 2.92;
									let xWaypointZ = 3.7;
									if (isBottomRow) {
										xWaypointZ = -xWaypointZ;
									}

									const xWaypointKey = `x_${xWaypointX.toFixed(
										2
									)}_${xWaypointZ.toFixed(2)}`;
									setVisitedWaypoints((prev) => ({
										...prev,
										[xWaypointKey]: true,
									}));
									setTimeout(() => {
										setBathroomDoors(playerPositionRoom, true);
									}, 50);

									const forcedPath = [
										{
											x: group.current.position.x,
											z: group.current.position.z,
											cost: 1,
											weight: 1,
										},
										{ x: xWaypointX, z: xWaypointZ, cost: 1, weight: 1 },
									];

									setCurrentPath(forcedPath);
									return;
								}
							}

							setCurrentPath(currentPath.slice(1));

							const monsterZAbs = Math.abs(group.current.position.z);
							if (monsterZAbs > 1.4 && monsterZAbs < 4.4) {
								lastPathfindingTimeRef.current = 0;
							}
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				} else {
					const isBottomRow = playerPositionRoom >= roomCount / 2;
					const monsterX = group.current.position.x;
					const monsterZ = group.current.position.z;
					const targetX = camera.position.x;
					const targetZ = camera.position.z;

					const currentTime = performance.now();
					const timeSinceLastPathfinding =
						currentTime - lastPathfindingTimeRef.current;

					if (directPathFailures >= maxDirectPathFailures) {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);
						return;
					}

					const playerCrossedWall = checkWallCrossing(
						camera.position.x,
						camera.position.z,
						lastTargetRef.current.x,
						lastTargetRef.current.z,
						playerPositionRoom,
						roomCount
					);

					if (
						!currentPath ||
						timeSinceLastPathfinding > PATHFINDING_INTERVAL ||
						playerCrossedWall
					) {
						const roomKey = Object.keys(seedData)[playerPositionRoom];
						const roomData = Object.values(seedData)[playerPositionRoom];
						const isFirstPathfinding = !usedForcedPathfinding[roomKey];

						if (
							roomData &&
							roomData.forcedGridX !== undefined &&
							roomData.forcedGridZ !== undefined &&
							isFirstPathfinding &&
							roomData.type !== 'hunter'
						) {
							const roomOffsetX = calculateRoomOffsetX(
								playerPositionRoom,
								roomCount
							);

							let gridX = roomData.forcedGridX;
							let gridZ = roomData.forcedGridZ;

							gridX += roomOffsetX;

							if (isBottomRow) {
								const zDistanceFromCenter = gridZ - OFFSET_Z;
								gridZ = OFFSET_Z - zDistanceFromCenter;

								gridX += BOTTOM_ROW_OFFSET_X;
								gridZ += BOTTOM_ROW_OFFSET_Z;
							}

							const worldX = (gridX - OFFSET_X) / 10;
							const worldZ = (gridZ - OFFSET_Z) / 10;

							group.current.position.x = worldX;
							group.current.position.z = worldZ;

							setUsedForcedPathfinding((prev) => ({
								...prev,
								[roomKey]: true,
							}));
						}

						const monsterZOffset = isBottomRow ? 2 : 0;

						if (useSimplePathfindingEnabled) {
							lastTargetRef.current = { x: targetX, z: targetZ };
							lastPathfindingTimeRef.current = currentTime;

							requestPathfinding(
								monsterX,
								monsterZ - monsterZOffset,
								targetX,
								targetZ
							).then((newPath) => {
								if (newPath) {
									setCurrentPath(newPath);
									setDirectPathFailures(0);
								} else {
									setDirectPathFailures((prevFailures) => prevFailures + 1);
									console.warn(`Pathfinding failure ${directPathFailures + 1}`);

									if (directPathFailures + 1 >= maxDirectPathFailures) {
										console.warn(
											'Switching to direct path mode until room change'
										);
									}
								}
							});
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							nextPoint.x - group.current.position.x,
							0,
							nextPoint.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(nextPoint.x - group.current.position.x, 2) +
								Math.pow(nextPoint.z - group.current.position.z, 2)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							const isXWaypoint = checkAndHandleXWaypoint(
								nextPoint,
								playerPositionRoom,
								roomCount
							);
							const waypointType = isXWaypoint ? 'x' : 'z';
							const waypointKey = `${waypointType}_${nextPoint.x.toFixed(
								2
							)}_${nextPoint.z.toFixed(2)}`;
							setVisitedWaypoints((prev) => ({
								...prev,
								[waypointKey]: true,
							}));

							const isZ44Waypoint = Math.abs(Math.abs(nextPoint.z) - 4.4) < 0.1;
							const playerZAbs = Math.abs(camera.position.z);
							const playerInCriticalZone = playerZAbs > 1.4 && playerZAbs < 4.4;

							if (isZ44Waypoint && playerInCriticalZone) {
								const isBottomRow = playerPositionRoom >= roomCount / 2;
								let roomIndex = 0;
								if (isBottomRow) {
									roomIndex = playerPositionRoom - Math.floor(roomCount / 2);
								} else {
									roomIndex = playerPositionRoom;
								}
								const roomOffsetX = calculateRoomOffsetX(
									playerPositionRoom,
									roomCount
								);

								const wallX = -1.35 + roomOffsetX + 2.92;
								const playerInBathroom = isBottomRow
									? camera.position.x > wallX
									: camera.position.x < wallX;
								const monsterInBathroom = isBottomRow
									? group.current.position.x > wallX
									: group.current.position.x < wallX;
								const needsXWaypoint = playerInBathroom;

								if (needsXWaypoint) {
									let xWaypointX =
										roomOffsetX + (isBottomRow ? 1.35 : -1.35) + 2.92;
									let xWaypointZ = 3.7;
									if (isBottomRow) {
										xWaypointZ = -xWaypointZ;
									}

									const xWaypointKey = `x_${xWaypointX.toFixed(
										2
									)}_${xWaypointZ.toFixed(2)}`;
									setVisitedWaypoints((prev) => ({
										...prev,
										[xWaypointKey]: true,
									}));
									setTimeout(() => {
										setBathroomDoors(playerPositionRoom, true);
									}, 50);

									const forcedPath = [
										{
											x: group.current.position.x,
											z: group.current.position.z,
											cost: 1,
											weight: 1,
										},
										{ x: xWaypointX, z: xWaypointZ, cost: 1, weight: 1 },
									];

									setCurrentPath(forcedPath);
									return;
								}
							}

							setCurrentPath(currentPath.slice(1));

							const monsterZAbs = Math.abs(group.current.position.z);
							if (monsterZAbs > 1.4 && monsterZAbs < 4.4) {
								lastPathfindingTimeRef.current = 0;
							}
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = calculateFrameRateIndependentMovement(
							speed,
							delta
						);
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				}
			}

			if (mode === 'run') {
				group.current.position.y = MONSTER_HEIGHT.GROUND;
			}
		},
		[
			playAnimation,
			jumpScare,
			currentPath,
			setAnimationSpeed,
			monsterState,
			lookAtCamera,
			setJumpScare,
			hasPlayedJumpScare,
			soundsReady,
			animationName,
			roomDoors,
			playerPositionRoom,
			seedData,
			setMonsterState,
			setShakeIntensity,
			directPathFailures,
			setDisableControls,
			usedForcedPathfinding,
			roomCount,
			hasTriggeredVibration,
			requestPathfinding,
			maxDirectPathFailures,
			useSimplePathfindingEnabled,
			calculateFrameRateIndependentMovement,
			checkWallCrossing,
			checkAndHandleXWaypoint,
			setVisitedWaypoints,
		]
	);

	useFrame(() => {
		const currentTime = performance.now();
		const delta = Math.min(
			(currentTime - lastFrameTimeRef.current) / 1000,
			0.033
		); // Max 30 FPS delta
		lastFrameTimeRef.current = currentTime;
		performanceDeltaRef.current = delta;
	});

	const setupHeadTracking = useCallback((nodes) => {
		if (!nodes || !nodes.mixamorigHips) return;

		nodes.mixamorigHips.traverse((bone) => {
			if (bone.name === 'mixamorigHead') {
				headBoneRef.current = bone;
			}
		});
	}, []);

	const useHeadTracking = useCallback(() => {
		useFrame(({ camera }) => {
			if (
				!headBoneRef.current ||
				monsterState === 'run' ||
				monsterState === 'chase' ||
				monsterState === 'leaving' ||
				monsterState === 'facingCamera' ||
				monsterState === 'endAnimation' ||
				animationName === 'Ceiling' ||
				isEndAnimationPlaying
			)
				return;

			const headOffset =
				Object.values(seedData)[playerPositionRoom]?.headOffset || 0;
			const headPosition = new THREE.Vector3();

			headBoneRef.current.getWorldPosition(headPosition);
			const targetPosition = new THREE.Vector3();
			targetPosition.copy(camera.position);
			const lookAtVector = new THREE.Vector3();
			lookAtVector.subVectors(targetPosition, headPosition).normalize();

			const isBottomRow =
				Object.keys(seedData).length !== 1 &&
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
		});
	}, [
		monsterState,
		animationName,
		isEndAnimationPlaying,
		seedData,
		playerPositionRoom,
	]);

	useEffect(() => {
		if (group.current) {
			group.current.rotation.set(
				monsterRotation[0],
				monsterRotation[1],
				monsterRotation[2]
			);
		}
	}, [monsterRotation]);

	useEffect(() => {
		if (
			(isEndAnimationPlaying || monsterState === 'endAnimation') &&
			headBoneRef.current
		) {
			headBoneRef.current.rotation.set(0, 0, 0);
		}
	}, [isEndAnimationPlaying, monsterState]);

	useEffect(() => {
		if (monsterState === 'facingCamera' && headBoneRef.current) {
			headBoneRef.current.rotation.set(0, 0, 0);
		}
	}, [monsterState]);

	const useEndAnimationLookAt = useCallback(() => {
		useFrame(({ camera }) => {
			if (monsterState === 'endAnimation' || isEndAnimationPlaying) {
				if (group.current) {
					const targetPosition = new THREE.Vector3(
						camera.position.x,
						group.current.position.y,
						camera.position.z
					);
					group.current.lookAt(targetPosition);
				}
			}
		});
	}, [monsterState, isEndAnimationPlaying]);

	useEffect(() => {
		if (
			(monsterState === 'hidden' && animationName === 'CeilingCrawlIdle') ||
			(monsterState === 'idle' &&
				animationName === 'CeilingCrawlIdle' &&
				group.current &&
				Math.abs(group.current.position.z) > 2)
		) {
			const zPos = Math.abs(group.current.position.z);
			if (zPos >= 5 && zPos <= 7.5) {
				group.current.position.y = MONSTER_HEIGHT.CEILING_HIGH;
			} else {
				group.current.position.y = MONSTER_HEIGHT.CEILING_IDLE_LOW;
			}
		}
	}, [monsterState, animationName, roomDoors]);

	const useMonsterBehavior = useCallback(() => {
		useFrame(({ camera }) => {
			const currentRoomValue = Object.values(seedData)[playerPositionRoom];
			if (currentRoomValue?.type === 'empty') {
				if (group.current) {
					group.current.position.y = 10;
				}
				if (
					monsterState !== 'hidden' ||
					(group.current && group.current.position.y < 10)
				) {
					setMonsterState('hidden');
					if (group.current) {
						setMonsterPosition([
							group.current.position.x,
							10,
							group.current.position.z,
						]);
					} else {
						setMonsterPosition([0, 10, 0]);
					}
				}
				return;
			}
			if (monsterState === 'facingCamera') {
				lookAtCamera(camera);
				if (
					Object.values(seedData)[playerPositionRoom]
						?.monsterInitialRotation?.[0]
				) {
					group.current.rotation.x = 2.7;
					group.current.rotation.y = group.current.rotation.y / 1.5 + 0.2;
					group.current.rotation.z = 0;
				}
			} else if (monsterState === 'run' || monsterState === 'chase') {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}

				runAtCamera(camera, performanceDeltaRef.current, monsterState);

				if (monsterState === 'run') {
					group.current.position.y = MONSTER_HEIGHT.GROUND;
				}
			} else if (monsterState === 'leaving') {
				const hideSpot = useHiding.getState().hideSpot;
				const isRightSide = playerPositionRoom >= roomCount / 2;
				const rightOffset = 1.76;

				let targetPosition;
				let targetRotation = 0;

				if (
					(hideSpot === 'roomCurtain' && !roomCurtain) ||
					(hideSpot === 'desk' && !deskDoor)
				) {
					targetPosition = new THREE.Vector3(
						-0.91 + (isRightSide ? rightOffset : 0),
						0,
						1.19 * (isRightSide ? -1 : 1)
					);
					targetRotation = isRightSide ? Math.PI : 0;
				} else if (hideSpot === 'nightstand' && !nightstandDoor) {
					targetPosition = new THREE.Vector3(
						-0.69 + (isRightSide ? rightOffset : -0.42),
						-0.5,
						4.21 * (isRightSide ? -1 : 1)
					);
					targetRotation = isRightSide ? Math.PI / 2 : -Math.PI / 2;
				} else if (hideSpot === 'bathroomCurtain' && !bathroomCurtain) {
					targetPosition = new THREE.Vector3(
						-0.78 + (isRightSide ? rightOffset : -0.26),
						0,
						3.18 * (isRightSide ? -1 : 1)
					);
					targetRotation = isRightSide ? 1 : Math.PI + 1;
				} else {
					setShakeIntensity(10);
					setMonsterState('run');
					playAnimation('Run');
					setAnimationSpeed(1);
					return;
				}

				let roomX;
				if (playerPositionRoom >= roomCount / 2) {
					roomX = -(playerPositionRoom - roomCount / 2) * CORRIDOR_LENGTH;
				} else {
					roomX = -playerPositionRoom * CORRIDOR_LENGTH;
				}
				const roomPosition = new THREE.Vector3(roomX, 0, 0);
				targetPosition.add(roomPosition);

				group.current.position.copy(targetPosition);
				group.current.rotation.y = targetRotation;

				if (!isWaiting) {
					setAnimationMixSpeed(1);
					playAnimation('Creeping');
					setAnimationSpeed(1);

					if (hideSpot === 'bathroomCurtain') {
						setBathroomDoors(playerPositionRoom, true);
					}

					setIsWaiting(true);
					timeoutRef.current = setTimeout(() => {
						setRoomDoor(playerPositionRoom, false);

						group.current.position.y = 10;
						setMonsterPosition([
							group.current.position.x,
							10,
							group.current.position.z,
						]);

						setMonsterState('hiding');
						setAnimationMixSpeed(5);
						setAnimationSpeed(1);
						playAnimation('Idle');

						setIsWaiting(false);
						setShakeIntensity(0);
					}, 5000);
				}
			}

			if (
				!Object.values(seedData)[playerPositionRoom]?.type &&
				!endAnimationPlaying &&
				group.current
			) {
				group.current.position.y = 10;
				setMonsterPosition([
					group.current.position.x,
					10,
					group.current.position.z,
				]);
			}
		});
	}, [
		monsterState,
		lookAtCamera,
		seedData,
		playerPositionRoom,
		runAtCamera,
		performanceDeltaRef,
		roomCount,
		roomCurtain,
		deskDoor,
		nightstandDoor,
		bathroomCurtain,
		setShakeIntensity,
		setMonsterState,
		playAnimation,
		setAnimationSpeed,
		isWaiting,
		setAnimationMixSpeed,
		setBathroomDoors,
		setRoomDoor,
		setMonsterPosition,
		endAnimationPlaying,
	]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			if (pathfindingRequestRef.current) {
				pathfindingRequestRef.current.cancelled = true;
			}
		};
	}, []);

	useEffect(() => {
		if (monsterState !== 'leaving' && timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
			setIsWaiting(false);
		}
	}, [monsterState]);

	useEffect(() => {
		if (animationName === 'Punch' && headBoneRef.current) {
			headBoneRef.current.rotation.set(0, 0, 0);
		}
	}, [animationName]);

	useEffect(() => {
		if (monsterState === 'run') {
			setBathroomDoors(playerPositionRoom, true);
		}
	}, [monsterState, playerPositionRoom, setBathroomDoors]);

	const useDeathVibration = useCallback(() => {
		useFrame(() => {
			if (
				jumpScare &&
				animationName === 'Attack' &&
				!hasTriggeredDeathVibration
			) {
				const mixer = useMonster.getState().mixer;
				if (mixer && mixer._actions.length > 0) {
					const attackAction = mixer._actions.find(
						(action) => action._clip.name === 'Attack'
					);
					if (attackAction && attackAction.time > 0.5) {
						vibrateControllers(1.0, 1500);
						setHasTriggeredDeathVibration(true);
					}
				}
			}
		});
	}, [jumpScare, animationName, hasTriggeredDeathVibration]);

	return {
		group,
		headBoneRef,

		hasPlayedJumpScare,
		hasTriggeredVibration,
		hasTriggeredDeathVibration,
		soundsReady,
		directPathFailures,
		currentPath,
		isWaiting,

		MONSTER_HEIGHT,

		lookAtCamera,
		runAtCamera,
		setupHeadTracking,

		useHeadTracking,
		useEndAnimationLookAt,
		useMonsterBehavior,
		useDeathVibration,
	};
}
