import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useMonster from './useMonster';
import useGame from './useGame';
import useDoor from './useDoor';
import useHiding from './useHiding';
import usePathfindingWorker from './usePathfindingWorker';
import {
	getAudioInstance,
	areSoundsLoaded,
	getWeightedRandomSound,
	CCB_JUMP_SCARE_SOUNDS,
} from '../utils/audio';
import useGameplaySettings from './useGameplaySettings';
import useGamepadControls, { vibrateControllers } from './useGamepadControls';

const BASE_SPEED = 5;
const CHASE_SPEED_BASE = 1.5;
const CLAYMORE_CHASE_SPEED = 5;
const NEXT_POINT_THRESHOLD = 0.5;
const MIN_DISTANCE_FOR_RECALCULATION = 15;
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

const MONSTER_HEIGHT = {
	GROUND: 0,
	CEILING_LOW: 1.35,
	CEILING_HIGH: 2,
	CEILING_MID: 1.2,
	CEILING_IDLE_LOW: 1.68,
};

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

export default function useMonsterLogic(isCCBVersion = false) {
	const maxDirectPathFailures = 10;
	const useWorkerPathfinding = true;
	const minDistanceForRecalculation = MIN_DISTANCE_FOR_RECALCULATION;

	const group = useRef();
	const jumpScareSoundRef = useRef(null);
	const [hasPlayedJumpScare, setHasPlayedJumpScare] = useState(false);
	const [hasTriggeredVibration, setHasTriggeredVibration] = useState(false);
	const [hasTriggeredDeathVibration, setHasTriggeredDeathVibration] =
		useState(false);
	const [soundsReady, setSoundsReady] = useState(false);
	const { gl } = useThree();
	const [directPathFailures, setDirectPathFailures] = useState(0);
	const lastChaseTimeRef = useRef(0);
	const lastFrameTimeRef = useRef(performance.now());
	const performanceDeltaRef = useRef(0);
	const headBoneRef = useRef();
	const lastTargetRef = useRef({ x: 0, z: 0 });
	const [isWaiting, setIsWaiting] = useState(false);
	const timeoutRef = useRef(null);
	const [usedForcedPathfinding, setUsedForcedPathfinding] = useState({});
	const [currentPath, setCurrentPath] = useState(null);
	const pathfindingRequestRef = useRef(null);
	const [isPathfindingInProgress, setIsPathfindingInProgress] = useState(false);

	useGamepadControls();

	const pathfindingWorker = useWorkerPathfinding
		? usePathfindingWorker()
		: { findPath: null, isWorkerReady: false };
	const { findPath: findPathWorker, isWorkerReady } = pathfindingWorker;

	// Game state
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

	// Monster state
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const animationName = useMonster((state) => state.animationName);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);

	// Door state
	const roomDoors = useDoor((state) => state.roomDoor);
	const nightstandDoor = useDoor((state) => state.nightStand);
	const deskDoor = useDoor((state) => state.desk);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const setRoomDoor = useDoor((state) => state.setRoomDoor);
	const setBathroomDoors = useDoor((state) => state.setBathroomDoors);

	// Sound setup
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

	const requestPathfinding = useCallback(
		async (monsterX, monsterZ, targetX, targetZ) => {
			if (!useWorkerPathfinding || !isWorkerReady || isPathfindingInProgress) {
				return null;
			}

			if (pathfindingRequestRef.current) {
				pathfindingRequestRef.current.cancelled = true;
			}

			const requestId = Date.now();
			pathfindingRequestRef.current = { id: requestId, cancelled: false };
			setIsPathfindingInProgress(true);

			try {
				const path = await findPathWorker(monsterX, monsterZ, targetX, targetZ);

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
			useWorkerPathfinding,
			isWorkerReady,
			isPathfindingInProgress,
			findPathWorker,
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
				if (!jumpScare) {
					setJumpScare(true);

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

				if (!hasPlayedJumpScare && soundsReady && jumpScareSoundRef.current) {
					jumpScareSoundRef.current.currentTime = 0;
					jumpScareSoundRef.current.play().catch(() => {});
					setHasPlayedJumpScare(true);

					if (isCCBVersion) {
						const randomJumpScareSound = getWeightedRandomSound(
							CCB_JUMP_SCARE_SOUNDS,
							'jumpScares'
						);
						const ccbJumpScareAudio = getAudioInstance(randomJumpScareSound);
						if (ccbJumpScareAudio) {
							ccbJumpScareAudio.currentTime = 0;
							ccbJumpScareAudio.volume = 0.8;
							ccbJumpScareAudio.play().catch(() => {});
						}
					}
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
					const monsterX = group.current.position.x * 10;
					const monsterZ = group.current.position.z * 10;
					const targetX = camera.position.x * 10;
					const targetZ = camera.position.z * 10;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

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

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
						return;
					}

					// Use pathfinding logic
					console.log(
						'distanceMoved',
						distanceMoved,
						minDistanceForRecalculation
					);
					if (!currentPath || distanceMoved > minDistanceForRecalculation) {
						if (useWorkerPathfinding) {
							// Reset lastTargetRef immediately when pathfinding is triggered
							lastTargetRef.current = { x: targetX, z: targetZ };

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
							nextPoint.x / 10 - group.current.position.x,
							0,
							nextPoint.z / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							group.current.position.x + direction.x,
							group.current.position.y,
							group.current.position.z + direction.z
						);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(nextPoint.x / 10 - group.current.position.x, 2) +
								Math.pow(nextPoint.z / 10 - group.current.position.z, 2)
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
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				} else {
					// Chase mode pathfinding logic
					const isBottomRow = playerPositionRoom >= roomCount / 2;
					const monsterX = group.current.position.x * 10;
					const monsterZ = group.current.position.z * 10;
					const targetX = camera.position.x * 10;
					const targetZ = camera.position.z * 10;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

					if (directPathFailures >= maxDirectPathFailures) {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);
						return;
					}

					if (!currentPath || distanceMoved > minDistanceForRecalculation) {
						const roomKey = Object.keys(seedData)[playerPositionRoom];
						const roomData = Object.values(seedData)[playerPositionRoom];
						const isFirstPathfinding = !usedForcedPathfinding[roomKey];

						if (
							roomData &&
							roomData.forcedGridX !== undefined &&
							roomData.forcedGridZ !== undefined &&
							isFirstPathfinding
						) {
							const CORRIDOR_LENGTH = 5.95;
							let roomIndex = 0;

							if (isBottomRow) {
								roomIndex = playerPositionRoom - Math.floor(roomCount / 2);
							} else {
								roomIndex = playerPositionRoom;
							}

							const roomOffsetX = -roomIndex * CORRIDOR_LENGTH * 10;

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

						if (useWorkerPathfinding) {
							lastTargetRef.current = { x: targetX, z: targetZ };

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
							nextPoint.x / 10 - group.current.position.x,
							0,
							nextPoint.z / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(nextPoint.x / 10 - group.current.position.x, 2) +
								Math.pow(nextPoint.z / 10 - group.current.position.z, 2)
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
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);
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
			isCCBVersion,
			maxDirectPathFailures,
			useWorkerPathfinding,
			minDistanceForRecalculation,
		]
	);

	// Performance delta calculation
	useFrame(() => {
		const currentTime = performance.now();
		const delta = Math.min(
			(currentTime - lastFrameTimeRef.current) / 1000,
			0.033
		); // Max 30 FPS delta
		lastFrameTimeRef.current = currentTime;
		performanceDeltaRef.current = delta;
	});

	// Head tracking logic
	const setupHeadTracking = useCallback((nodes) => {
		if (!nodes || !nodes.mixamorigHips) return;

		nodes.mixamorigHips.traverse((bone) => {
			if (bone.name === 'mixamorigHead') {
				headBoneRef.current = bone;
			}
		});
	}, []);

	// Head look at camera frame logic
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

	// Monster rotation sync
	useEffect(() => {
		if (group.current) {
			group.current.rotation.set(
				monsterRotation[0],
				monsterRotation[1],
				monsterRotation[2]
			);
		}
	}, [monsterRotation]);

	// Reset head rotation for certain states
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

	// End animation look at camera
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

	// Ceiling position logic
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

	// Main monster behavior frame logic
	const useMonsterBehavior = useCallback(() => {
		useFrame(({ camera }) => {
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

				const CORRIDOR_LENGTH = 5.95;
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

	// Cleanup timeouts
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

	// Clear timeout when not leaving
	useEffect(() => {
		if (monsterState !== 'leaving' && timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
			setIsWaiting(false);
		}
	}, [monsterState]);

	// Reset head rotation for punch animation
	useEffect(() => {
		if (animationName === 'Punch' && headBoneRef.current) {
			headBoneRef.current.rotation.set(0, 0, 0);
		}
	}, [animationName]);

	// Death vibration trigger
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
		// Refs
		group,
		headBoneRef,

		// State
		hasPlayedJumpScare,
		hasTriggeredVibration,
		hasTriggeredDeathVibration,
		soundsReady,
		directPathFailures,
		currentPath,
		isWaiting,

		// Constants
		MONSTER_HEIGHT,

		// Functions
		lookAtCamera,
		runAtCamera,
		setupHeadTracking,

		// Hooks to use in components
		useHeadTracking,
		useEndAnimationLookAt,
		useMonsterBehavior,
		useDeathVibration,
	};
}
