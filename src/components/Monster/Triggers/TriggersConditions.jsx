import { useRef, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import useMonster from '../../../hooks/useMonster';
import useInterface from '../../../hooks/useInterface';
import useDoor from '../../../hooks/useDoor';
import {
	placeMonsterAtSecondPosition,
	shakeCamera,
	playerIsInsideZone,
	playerIsLookingAtBox,
	getLookAtPointPosition,
} from './triggersUtils';
import useGameplaySettings from '../../../hooks/useGameplaySettings';
import useHiding from '../../../hooks/useHiding';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;
const LOOK_AT_DURATION = 10000;
const RAID_DURATION = 8000;
const RAID_DURATION_MOBILE = 11000;
const CLAYMORE_DURATION = 2000;
const CLAYMORE_DURATION_MOBILE = 4000;

export default function TriggersConditions({
	monsterBox,
	zoneBox,
	instantBox,
	cameraShakingBox,
	position,
}) {
	// Game
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const shakeIntensity = useGame((state) => state.shakeIntensity);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const setTv = useGame((state) => state.setTv);
	const setRadio = useGame((state) => state.setRadio);
	const tv = useGame((state) => state.tv);
	const radio = useGame((state) => state.radio);
	const setActiveTvs = useGame((state) => state.setActiveTvs);
	const setActiveRadios = useGame((state) => state.setActiveRadios);
	const completedObjective = useGame((state) => state.completedObjective);
	const completedRoom = useGame((state) => state.completedRoom);
	const resetCompletedObjective = useGame(
		(state) => state.resetCompletedObjective
	);
	const setActiveRaid = useGame((state) => state.setActiveRaid);
	const activeRaids = useGame((state) => state.activeRaids);
	const setActiveInscriptions = useGame((state) => state.setActiveInscriptions);
	const setDisableControls = useGame((state) => state.setDisableControls);
	const setMonsterAttackDisableControls = useGame(
		(state) => state.setMonsterAttackDisableControls
	);
	const isMobile = useGame((state) => state.isMobile);
	const setTemporaryDisableMouseLook = useGame(
		(state) => state.setTemporaryDisableMouseLook
	);
	const setCustomDeathMessage = useGame((state) => state.setCustomDeathMessage);
	const knockedRooms = useGame((state) => state.knockedRooms);
	const addKnockedRoom = useGame((state) => state.addKnockedRoom);

	// Interface
	const interfaceObjectives = useInterface(
		(state) => state.interfaceObjectives
	);

	// Monster
	const playAnimation = useMonster((state) => state.playAnimation);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterRotation = useMonster((state) => state.setMonsterRotation);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);

	// Doors
	const roomDoors = useDoor((state) => state.roomDoor);
	const roomCurtains = useDoor((state) => state.roomCurtains);
	const deskDoors = useDoor((state) => state.desks);
	const nightstandDoors = useDoor((state) => state.nightStands);
	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const bathroomCurtains = useDoor((state) => state.bathroomCurtains);
	const setNightStands = useDoor((state) => state.setNightStands);
	const setRoomCurtains = useDoor((state) => state.setRoomCurtains);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const setRoomDoor = useDoor((state) => state.setRoomDoor);

	// Hiding
	const setMonsterKnocking = useHiding((state) => state.setMonsterKnocking);
	const setKnockingRoom = useHiding((state) => state.setKnockingRoom);
	const setMonsterEntering = useHiding((state) => state.setMonsterEntering);
	const setSilentKnocking = useHiding((state) => state.setSilentKnocking);

	const [isLookingAtTarget, setIsLookingAtTarget] = useState(false);
	const lookAtStartTimeRef = useRef(null);
	const lookAtTargetRef = useRef(null);
	const attackTimeoutRef = useRef(null);
	const quickTimeoutRef = useRef(null);
	const raidRoomRef = useRef(null);
	const raidAttackStartedRef = useRef(false);
	const sonarBathroomRef = useRef({ stateSet: false, attackTriggered: false });
	const hunterTriggeredRoomsRef = useRef({});
	const hunterDoorClosedFromOutsideRef = useRef({});

	const claymoreDoorsRef = useRef({});

	const triggerRAID = useCallback(
		(room) => {
			let monsterX;
			if (room >= roomCount / 2) {
				monsterX = -(room - roomCount / 2) * CORRIDORLENGTH;
			} else {
				monsterX = -room * CORRIDORLENGTH;
			}

			setMonsterPosition([monsterX, 10, 0]);
			setMonsterRotation([0, 0, 0]);
			raidRoomRef.current = room;

			if (roomDoors[room]) {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');
				setAnimationSpeed(1);
				setCustomDeathMessage('game.deathReasons.raidDoor');
			} else if (!knockedRooms.includes(room)) {
				addKnockedRoom(room);
				setMonsterKnocking(true);
				setKnockingRoom(room);

				const roomType =
					Object.values(seedData)[playerPositionRoom]?.baseKey ||
					Object.keys(seedData)[playerPositionRoom];
				if (
					roomType === 'raidTV' ||
					roomType === 'raidRadio' ||
					roomType === 'raidInscriptions'
				) {
					setSilentKnocking(true);
				} else {
					setSilentKnocking(false);
				}

				setTimeout(
					() => {
						if (useHiding.getState().isMonsterKnocking) {
							setShakeIntensity(1);
							setRoomDoor(room, true);
							playAnimation('Idle');

							const isHidden = useHiding.getState().isPlayerHidden;

							if (!isHidden) {
								setMonsterKnocking(false);
								setMonsterEntering(true);
								setMonsterState('run');
								playAnimation('Run');
								setAnimationSpeed(1);
								setSilentKnocking(false);

								raidAttackStartedRef.current = true;
							} else if (!raidAttackStartedRef.current) {
								setMonsterKnocking(false);
								setAnimationMixSpeed(2);
								setAnimationSpeed(0.5);
								setMonsterState('leaving');
								if (Object.values(seedData)[playerPositionRoom].ceiling) {
									playAnimation('CeilingCrawl');
								} else {
									playAnimation('Walk');
								}
								setSilentKnocking(false);
							}
						}
					},
					isMobile ? RAID_DURATION_MOBILE : RAID_DURATION
				);
			}
		},
		[
			playerPositionRoom,
			roomCount,
			seedData,
			setMonsterPosition,
			setMonsterRotation,
			roomDoors,
			setShakeIntensity,
			setMonsterState,
			playAnimation,
			setAnimationSpeed,
			knockedRooms,
			addKnockedRoom,
			setMonsterKnocking,
			setKnockingRoom,
			setRoomDoor,
			setMonsterEntering,
			setAnimationMixSpeed,
			setSilentKnocking,
			isMobile,
			setCustomDeathMessage,
		]
	);

	const monsterAttack = useCallback(() => {
		setShakeIntensity(10);
		setMonsterState('run');
		playAnimation('Run');
	}, [setShakeIntensity, setMonsterState, playAnimation]);

	const monsterLandmineAttack = useCallback(() => {
		const lookAtPoint =
			Object.values(seedData)[playerPositionRoom]?.lookAtPoint;
		if (lookAtPoint && !isLookingAtTarget) {
			lookAtTargetRef.current = getLookAtPointPosition(
				lookAtPoint,
				playerPositionRoom,
				roomCount,
				position,
				CORRIDORLENGTH
			);
			lookAtStartTimeRef.current = Date.now();

			setIsLookingAtTarget(true);
			setDisableControls(true);
			setMonsterAttackDisableControls(true);

			setTemporaryDisableMouseLook(true);

			setTimeout(() => {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');

				lookAtTargetRef.current = null;
				lookAtStartTimeRef.current = null;
				setIsLookingAtTarget(false);
				setTemporaryDisableMouseLook(false);
			}, 800);
		}
	}, [
		seedData,
		playerPositionRoom,
		isLookingAtTarget,
		setDisableControls,
		setMonsterAttackDisableControls,
		position,
		roomCount,
		setShakeIntensity,
		setMonsterState,
		playAnimation,
		setTemporaryDisableMouseLook,
	]);

	const checkObjectiveAndAttack = (objectives, objectiveIndex) => {
		if (objectives[playerPositionRoom]?.[objectiveIndex]) {
			useGame.getState().setCustomDeathMessage('game.deathReasons.objective');
			monsterAttack();
			return true;
		}
		return false;
	};

	const basicHiding = (
		clock,
		camera,
		raycaster,
		useInstantBox = false,
		objectiveIndex = 2,
		delayed
	) => {
		setMonsterState('hidden');
		let monsterIsTriggered = false;
		if (interfaceObjectives[playerPositionRoom]?.[objectiveIndex]) {
			playAnimation('Idle');
			placeMonsterAtSecondPosition(
				seedData,
				playerPositionRoom,
				setMonsterState,
				setMonsterPosition,
				position,
				roomCount,
				setMonsterRotation
			);
			bathroomDoors[playerPositionRoom] = true;
			monsterIsTriggered = shakeCamera(
				clock,
				playerIsLookingAtBox(monsterBox, camera),
				setShakeIntensity,
				shakeIntensity
			);

			if (!attackTimeoutRef.current && monsterState !== 'run') {
				attackTimeoutRef.current = setTimeout(() => {
					if (monsterState !== 'run') {
						monsterAttack();
					}
					attackTimeoutRef.current = null;
				}, 4000);
			}
		} else if (useInstantBox) {
			monsterIsTriggered = shakeCamera(
				clock,
				playerIsInsideZone(cameraShakingBox, raycaster, camera) &&
					playerIsLookingAtBox(
						instantBox,
						camera,
						useInstantBox === 'underBed'
					),
				setShakeIntensity,
				shakeIntensity,
				delayed
			);
		}

		if (
			(playerIsInsideZone(zoneBox, raycaster, camera) &&
				interfaceObjectives[playerPositionRoom]?.[objectiveIndex]) ||
			monsterIsTriggered
		) {
			if (attackTimeoutRef.current) {
				clearTimeout(attackTimeoutRef.current);
				attackTimeoutRef.current = null;
			}
			monsterAttack();
			bathroomDoors[playerPositionRoom] = true;
		}
	};

	const doNotGetAnyCloser = (
		monsterStateValue,
		raycaster,
		camera,
		clock,
		shakeIntensity,
		delayed
	) => {
		if (
			playerIsInsideZone(monsterBox, raycaster, camera) ||
			playerIsInsideZone(instantBox, raycaster, camera) ||
			shakeCamera(
				clock,
				playerIsInsideZone(cameraShakingBox, raycaster, camera) &&
					playerIsLookingAtBox(monsterBox, camera),
				setShakeIntensity,
				shakeIntensity,
				delayed
			)
		) {
			monsterLandmineAttack();
		}

		if (monsterState !== monsterStateValue) {
			setMonsterState(monsterStateValue);
		}
	};

	const closeTheDoorQuickly = (doorState, clock, roomKey) => {
		const doorStateKey = `${playerPositionRoom}-${roomKey}`;
		if (!claymoreDoorsRef.current[doorStateKey]) {
			claymoreDoorsRef.current[doorStateKey] = {
				wasOpened: false,
				wasClosed: false,
				reopened: false,
			};
		}

		if (doorState && !claymoreDoorsRef.current[doorStateKey].wasOpened) {
			claymoreDoorsRef.current[doorStateKey].wasOpened = true;
		} else if (
			!doorState &&
			claymoreDoorsRef.current[doorStateKey].wasOpened &&
			!claymoreDoorsRef.current[doorStateKey].wasClosed
		) {
			claymoreDoorsRef.current[doorStateKey].wasClosed = true;
		} else if (
			doorState &&
			claymoreDoorsRef.current[doorStateKey].wasOpened &&
			claymoreDoorsRef.current[doorStateKey].wasClosed
		) {
			claymoreDoorsRef.current[doorStateKey].reopened = true;
		}

		if (doorState && claymoreDoorsRef.current[doorStateKey].reopened) {
			monsterAttack();
			return;
		}

		if (doorState && !claymoreDoorsRef.current[doorStateKey].wasClosed) {
			if (!quickTimeoutRef.current) {
				quickTimeoutRef.current = setTimeout(
					() => {
						monsterAttack();
						quickTimeoutRef.current = null;
					},
					isMobile ? CLAYMORE_DURATION_MOBILE : CLAYMORE_DURATION
				);
			}
		} else {
			if (quickTimeoutRef.current) {
				clearTimeout(quickTimeoutRef.current);
				quickTimeoutRef.current = null;
			}
		}
	};

	function updateCameraLookAt(camera, targetPoint, intensity = 0.1, clock) {
		if (!targetPoint) return;

		const elapsedTime = (Date.now() - lookAtStartTimeRef.current) / 1000;
		const lookAtProgress = elapsedTime / (LOOK_AT_DURATION / 1000);

		const oscillationIntensity = Math.min(1, lookAtProgress * 2) * 0.1;

		const time = clock.getElapsedTime();
		const oscX = Math.sin(time * 1.5) * oscillationIntensity;
		const oscY = Math.sin(time * 2.0) * oscillationIntensity * 0.8;

		const oscZ = Math.sin(time * 0.8) * oscillationIntensity * 0.3;

		const oscillatedTarget = new THREE.Vector3(
			targetPoint.x + oscX,
			targetPoint.y + oscY,
			targetPoint.z + oscZ
		);

		const headTilt =
			Math.sin(time * 0.5) * oscillationIntensity * 0.02 * (1 + lookAtProgress);
		camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, headTilt, 0.02);

		const direction = new THREE.Vector3()
			.subVectors(oscillatedTarget, camera.position)
			.normalize();

		const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
			new THREE.Vector3(0, 0, -1),
			direction
		);

		if (lookAtProgress > 0.2) {
			camera.quaternion.copy(targetQuaternion);
		} else {
			const adaptiveIntensity = Math.min(
				0.5,
				intensity * (1 + lookAtProgress * 3)
			);
			camera.quaternion.slerp(targetQuaternion, adaptiveIntensity);
		}
	}

	function playHunterIdleAnimation(
		isCeilingType,
		isNightstandType,
		isLivingRoomType
	) {
		setMonsterState('hidden');

		if (isLivingRoomType) {
			playAnimation('Wall');
		} else if (isCeilingType) {
			playAnimation('CeilingCrawlIdle');
		} else if (
			isNightstandType &&
			!hunterTriggeredRoomsRef.current[playerPositionRoom]
		) {
			playAnimation('Stand');
		} else {
			playAnimation('Idle');
		}
	}

	useEffect(() => {
		if (monsterState === 'leaving' || monsterState === 'hiding') {
			activeRaids.forEach((room) => {
				if (!roomDoors[room]) {
					const roomType =
						Object.values(seedData)[room]?.baseKey ||
						Object.keys(seedData)[room];
					if (roomType === 'raidTV') {
						setTv(false);
						setActiveTvs(room);
					} else if (roomType === 'raidRadio') {
						setRadio(false);
						setActiveRadios(room);
					} else if (roomType === 'raidInscriptions') {
						setActiveInscriptions(room, false);
					}
					setActiveRaid(room, false);
				}
			});
		}
	}, [
		monsterState,
		roomDoors,
		activeRaids,
		setTv,
		setRadio,
		setActiveTvs,
		setActiveRadios,
		setActiveInscriptions,
		setActiveRaid,
		seedData,
	]);

	useEffect(() => {
		const unsubscribe = useDoor.subscribe(
			(state) => state.roomDoor,
			(roomDoor) => {
				if (raidRoomRef.current !== null && roomDoor[raidRoomRef.current]) {
					setMonsterKnocking(false);
					setKnockingRoom(null);

					setShakeIntensity(10);
					setMonsterState('run');
					playAnimation('Run');
					setAnimationSpeed(1);
				}
			}
		);

		return () => unsubscribe();
	}, [
		setShakeIntensity,
		setMonsterState,
		playAnimation,
		setAnimationSpeed,
		setMonsterKnocking,
		setKnockingRoom,
	]);

	useEffect(() => {
		const unsubscribe = useMonster.subscribe(
			(state) => state.monsterState,
			(monsterState) => {
				if (
					monsterState !== 'knock' &&
					monsterState !== 'run' &&
					raidRoomRef.current !== null
				) {
					raidRoomRef.current = null;
				}

				if (monsterState === 'hidden' || monsterState === 'hiding') {
					raidAttackStartedRef.current = false;
				}
			}
		);

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		sonarBathroomRef.current = { stateSet: false, attackTriggered: false };
		raidAttackStartedRef.current = false;

		claymoreDoorsRef.current = {};
	}, [playerPositionRoom]);

	useEffect(() => {
		hunterTriggeredRoomsRef.current = {};
		hunterDoorClosedFromOutsideRef.current = {};
		claymoreDoorsRef.current = {};
	}, [seedData]);

	useFrame(({ camera, raycaster, clock }) => {
		if (
			!Object.values(seedData)[playerPositionRoom] ||
			Object.values(seedData)[playerPositionRoom]?.type === 'empty' ||
			monsterState === 'run' ||
			camera.position.x > 3
		) {
			if (
				Object.values(seedData)[playerPositionRoom]?.type === 'empty' &&
				(monsterState !== 'hidden' || monsterPosition[1] < 10)
			) {
				setMonsterState('hidden');
				setMonsterPosition([monsterPosition[0], 10, monsterPosition[2]]);
			}
			return;
		}

		const roomKey =
			Object.values(seedData)[playerPositionRoom]?.baseKey ||
			Object.keys(seedData)[playerPositionRoom];

		switch (roomKey) {
			case 'underBed':
				basicHiding(clock, camera, raycaster, 'underBed');
				break;
			case 'bathroomVent':
			case 'hideoutMirror':
				if (interfaceObjectives[playerPositionRoom]?.[0]) {
					monsterAttack();
				}
				break;
			case 'roomVent':
				basicHiding(clock, camera, raycaster, false, 2);
				break;
			case 'bedBasket': {
				setMonsterState('hidden');
				if (interfaceObjectives[playerPositionRoom]?.[2]) {
					playAnimation('Idle');
					placeMonsterAtSecondPosition(
						seedData,
						playerPositionRoom,
						setMonsterState,
						setMonsterPosition,
						position,
						roomCount,
						setMonsterRotation
					);
					bathroomDoors[playerPositionRoom] = true;
				}

				if (
					playerIsInsideZone(zoneBox, raycaster, camera) &&
					interfaceObjectives[playerPositionRoom]?.[2]
				) {
					if (attackTimeoutRef.current) {
						clearTimeout(attackTimeoutRef.current);
						attackTimeoutRef.current = null;
					}
					monsterAttack();
					bathroomDoors[playerPositionRoom] = true;
				}
				break;
			}
			case 'windowBasket':
				basicHiding(clock, camera, raycaster, true, 2, true);
				break;
			case 'footWindow':
				if (roomCurtains[playerPositionRoom]) {
					monsterAttack();
				}
				break;
			case 'behindDoor': {
				let monsterIsTriggered = false;
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				monsterIsTriggered = shakeCamera(
					clock,
					playerIsInsideZone(cameraShakingBox, raycaster, camera) &&
						playerIsLookingAtBox(instantBox, camera),
					setShakeIntensity,
					shakeIntensity,
					true
				);

				const shouldAttack =
					!roomDoors[playerPositionRoom] && Math.abs(camera.position.z) > 1.3;

				if (
					!roomDoors[playerPositionRoom] &&
					Math.abs(camera.position.z) > 2.5
				) {
					setTimeout(() => {
						if (attackTimeoutRef.current) {
							clearTimeout(attackTimeoutRef.current);
							attackTimeoutRef.current = null;
						}
						monsterAttack();
					}, 100);
				} else if (shouldAttack) {
					if (!attackTimeoutRef.current) {
						attackTimeoutRef.current = setTimeout(() => {
							if (
								!roomDoors[playerPositionRoom] &&
								Math.abs(camera.position.z) > 1.3
							) {
								monsterAttack();
							}
							attackTimeoutRef.current = null;
						}, 1000);
					}
				} else {
					if (attackTimeoutRef.current) {
						clearTimeout(attackTimeoutRef.current);
						attackTimeoutRef.current = null;
					}
				}

				if (
					playerIsInsideZone(zoneBox, raycaster, camera) ||
					playerIsInsideZone(monsterBox, raycaster, camera) ||
					monsterIsTriggered
				) {
					if (attackTimeoutRef.current) {
						clearTimeout(attackTimeoutRef.current);
						attackTimeoutRef.current = null;
					}
					monsterAttack();
				}
				break;
			}
			case 'nearWindow':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				if (
					playerIsInsideZone(monsterBox, raycaster, camera) ||
					playerIsInsideZone(instantBox, raycaster, camera) ||
					shakeCamera(
						clock,
						playerIsInsideZone(cameraShakingBox, raycaster, camera) &&
							playerIsLookingAtBox(monsterBox, camera),
						setShakeIntensity,
						shakeIntensity
					)
				) {
					monsterAttack();
				}
				break;
			// case 'bedCorner':
			case 'ceilingCenter':
			case 'ceilingCornerCouch':
			case 'behindCouch':
			case 'behindDesk':
			case 'insideDesk':
				doNotGetAnyCloser(
					'hidden',
					raycaster,
					camera,
					clock,
					shakeIntensity,
					true
				);
				break;
			case 'landmineMirror':
				doNotGetAnyCloser(
					'facingCamera',
					raycaster,
					camera,
					clock,
					shakeIntensity
				);
				break;

			case 'sonarBathroom':
				if (!sonarBathroomRef.current.stateSet) {
					setMonsterState('facingCamera');
					playAnimation('Idle');
					sonarBathroomRef.current.stateSet = true;
				}

				if (
					bathroomDoors[playerPositionRoom] &&
					!sonarBathroomRef.current.attackTriggered
				) {
					sonarBathroomRef.current.attackTriggered = true;
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			// case 'claymoreWindow':
			// 	if (monsterState !== 'facingCamera') {
			// 		setMonsterState('facingCamera');
			// 	}
			// 	closeTheDoorQuickly(roomCurtains[playerPositionRoom], clock);
			// 	break;
			case 'claymoreBath':
				closeTheDoorQuickly(
					bathroomCurtains[playerPositionRoom],
					clock,
					roomKey
				);
				checkObjectiveAndAttack(interfaceObjectives, 0);

				if (Math.abs(camera.position.z) < 1.5) {
					setMonsterPosition([monsterPosition[0], 10, monsterPosition[2]]);
				} else {
					setMonsterPosition([monsterPosition[0], 0, monsterPosition[2]]);
				}
				break;
			case 'claymoreDesk':
				if (interfaceObjectives[playerPositionRoom]?.[2]) {
					if (playerIsInsideZone(zoneBox, raycaster, camera)) {
						setCustomDeathMessage('game.deathReasons.claymoreChase');
						setMonsterState('chase');
						playAnimation('Walk');
						setAnimationSpeed(0.5);
						deskDoors[playerPositionRoom] = true;
					}
				} else {
					closeTheDoorQuickly(deskDoors[playerPositionRoom], clock, roomKey);
				}
				break;
			case 'claymoreNightstand':
				if (interfaceObjectives[playerPositionRoom]?.[2]) {
					if (playerIsInsideZone(zoneBox, raycaster, camera)) {
						setCustomDeathMessage('game.deathReasons.claymoreChase');
						setMonsterState('chase');
						playAnimation('Walk');
						setAnimationSpeed(0.5);
						nightstandDoors[playerPositionRoom] = true;
					}
				} else {
					closeTheDoorQuickly(
						nightstandDoors[playerPositionRoom],
						clock,
						roomKey
					);
				}
				break;
			case 'claymoreBathroom':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				closeTheDoorQuickly(bathroomDoors[playerPositionRoom], clock, roomKey);
				break;
			case 'hunterLivingRoom':
			case 'hunterCeilingLivingRoom':
			case 'hunterNightstand':
			case 'hunterWindow': {
				const currentRoomDoorState = roomDoors[playerPositionRoom];
				const isDoorClosed = !currentRoomDoorState;
				const isInCurrentRoom = Math.abs(camera.position.z) > 1.8;

				const isNightstandType = roomKey.includes('hunterNightstand');
				const isWindowType = roomKey.includes('hunterWindow');
				const isLivingRoomType = roomKey.includes('hunterLivingRoom');
				const isCeilingType =
					Object.values(seedData)[playerPositionRoom]?.ceiling;

				if (
					!isDoorClosed &&
					!isInCurrentRoom &&
					!hunterTriggeredRoomsRef.current[playerPositionRoom]
				) {
					playHunterIdleAnimation(
						isCeilingType,
						isNightstandType,
						isLivingRoomType
					);

					setMonsterRotation([
						Object.values(seedData)[playerPositionRoom]
							?.monsterInitialRotation[0],
						Object.values(seedData)[playerPositionRoom]
							?.monsterInitialRotation[1] +
							(playerPositionRoom >= roomCount / 2 ? Math.PI : 0),
						Object.values(seedData)[playerPositionRoom]
							?.monsterInitialRotation[2],
					]);
				}

				if (
					!isDoorClosed &&
					hunterTriggeredRoomsRef.current[playerPositionRoom] &&
					hunterDoorClosedFromOutsideRef.current[playerPositionRoom] === true
				) {
					monsterAttack();
				} else if (isDoorClosed && !isInCurrentRoom) {
					if (monsterState !== 'hidden') {
						playHunterIdleAnimation(isCeilingType, isNightstandType);
					}

					if (hunterTriggeredRoomsRef.current[playerPositionRoom]) {
						hunterDoorClosedFromOutsideRef.current[playerPositionRoom] = true;
					}
				} else if (
					(isNightstandType && nightstandDoors[playerPositionRoom]) ||
					(isWindowType && roomCurtains[playerPositionRoom]) ||
					(!isNightstandType &&
						!isWindowType &&
						playerIsInsideZone(zoneBox, raycaster, camera))
				) {
					hunterTriggeredRoomsRef.current[playerPositionRoom] = true;

					if (monsterState !== 'chase') {
						setAnimationMixSpeed(2);
						setMonsterState('chase');
						playAnimation(isCeilingType ? 'CeilingCrawl' : 'Walk');
						setAnimationSpeed(
							0.5 + (isNightstandType || isWindowType ? 0.1 : 0)
						);
					}
				} else {
					if (monsterState !== 'hidden' && (isNightstandType || isWindowType)) {
						setMonsterState('hidden');
						playAnimation('Crouch');
					}
				}

				if (
					isNightstandType &&
					playerIsInsideZone(zoneBox, raycaster, camera) &&
					!nightstandDoors[playerPositionRoom]
				) {
					setNightStands(playerPositionRoom, true);
					hunterTriggeredRoomsRef.current[playerPositionRoom] = true;
				}
				if (
					isWindowType &&
					playerIsInsideZone(zoneBox, raycaster, camera) &&
					!roomCurtains[playerPositionRoom]
				) {
					setRoomCurtains(playerPositionRoom, true);
					setRoomCurtain(true);
				}
				break;
			}

			case 'raidTV': {
				if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (!tv && !knockedRooms.includes(playerPositionRoom)) {
						setTv(true);
						setActiveTvs(playerPositionRoom);

						setActiveRaid(playerPositionRoom, true);

						triggerRAID(playerPositionRoom);
					}
				}
				break;
			}

			case 'raidRadio': {
				if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (!radio && !knockedRooms.includes(playerPositionRoom)) {
						setRadio(true);
						setActiveRadios(playerPositionRoom);

						setActiveRaid(playerPositionRoom, true);

						triggerRAID(playerPositionRoom);
					}
				}
				break;
			}

			case 'raidInscriptions': {
				if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (
						!knockedRooms.includes(playerPositionRoom) &&
						!activeRaids.includes(playerPositionRoom)
					) {
						setActiveInscriptions(playerPositionRoom, true);
						setActiveRaid(playerPositionRoom, true);

						setTimeout(() => {
							triggerRAID(playerPositionRoom);
						}, RAID_DURATION / 4);
					}
				}
				break;
			}

			case 'raidWindow': {
				if (completedObjective && completedRoom !== null) {
					triggerRAID(completedRoom);
					resetCompletedObjective();
					return;
				}
				break;
			}

			case 'raidBedsheets': {
				if (completedObjective && completedRoom !== null) {
					triggerRAID(completedRoom);
					resetCompletedObjective();
					return;
				}
				break;
			}

			case 'raidBottles': {
				if (completedObjective && completedRoom !== null) {
					triggerRAID(completedRoom);
					resetCompletedObjective();
					return;
				}

				break;
			}

			default:
				break;
		}
	});

	useFrame(({ clock, camera }) => {
		if (isLookingAtTarget) {
			updateCameraLookAt(camera, lookAtTargetRef.current, 0.05, clock);
		}
	});

	return null;
}
