import { useRef, useCallback, useEffect } from 'react';
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
} from './triggersUtils';
import useGameplaySettings from '../../../hooks/useGameplaySettings';
import useHiding from '../../../hooks/useHiding';

const CORRIDORLENGTH = 5.95;

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
	const setNightStands = useDoor((state) => state.setNightStands);
	const setRoomCurtains = useDoor((state) => state.setRoomCurtains);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const setRoomDoor = useDoor((state) => state.setRoomDoor);

	const knockedRooms = useGame((state) => state.knockedRooms);
	const addKnockedRoom = useGame((state) => state.addKnockedRoom);
	const monsterKnockDuration = useGame((state) => state.monsterKnockDuration);

	// Hiding
	const setMonsterKnocking = useHiding((state) => state.setMonsterKnocking);
	const setKnockingRoom = useHiding((state) => state.setKnockingRoom);
	const setMonsterEntering = useHiding((state) => state.setMonsterEntering);
	const setSilentKnocking = useHiding((state) => state.setSilentKnocking);

	const attackTimeoutRef = useRef(null);
	const quickTimeoutRef = useRef(null);
	const raidRoomRef = useRef(null);
	const sonarBathroomRef = useRef({ stateSet: false, attackTriggered: false });
	const hunterTriggeredRoomsRef = useRef({});
	const hunterDoorClosedFromOutsideRef = useRef({});

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

				setTimeout(() => {
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
						} else {
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
				}, monsterKnockDuration);
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
			monsterKnockDuration,
			setRoomDoor,
			setMonsterEntering,
			setAnimationMixSpeed,
			setSilentKnocking,
		]
	);

	const monsterAttack = () => {
		setShakeIntensity(10);
		setMonsterState('run');
		playAnimation('Run');
	};

	const checkObjectiveAndAttack = (objectives, objectiveIndex) => {
		if (objectives[playerPositionRoom]?.[objectiveIndex]) {
			useGame
				.getState()
				.setCustomDeathMessage(
					'Always check the furniture before cleaning the room'
				);
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
				roomCount
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
		delayed
	) => {
		if (monsterState !== monsterStateValue) {
			setMonsterState(monsterStateValue);
		}

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
			setMonsterPosition([
				Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition[0] +
					position[0],
				10,
				Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition[2] +
					position[2],
			]);
			monsterAttack();
		}
	};

	const closeTheDoorQuickly = (doorState, clock) => {
		shakeCamera(clock, doorState, setShakeIntensity, shakeIntensity);

		if (doorState) {
			if (!quickTimeoutRef.current) {
				quickTimeoutRef.current = setTimeout(() => {
					monsterAttack();
					quickTimeoutRef.current = null;
				}, 2000);
			}
		} else {
			if (quickTimeoutRef.current) {
				clearTimeout(quickTimeoutRef.current);
				quickTimeoutRef.current = null;
			}
		}
	};

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
			}
		);

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		sonarBathroomRef.current = { stateSet: false, attackTriggered: false };
	}, [playerPositionRoom]);

	useEffect(() => {
		hunterTriggeredRoomsRef.current = {};
		hunterDoorClosedFromOutsideRef.current = {};
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
				basicHiding(clock, camera, raycaster, false, 0);
				break;
			case 'roomVent':
				basicHiding(clock, camera, raycaster, false, 2);
				break;
			case 'bedBasket':
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
					shakeIntensity
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
				doNotGetAnyCloser('hidden', raycaster, camera, clock, true);
				break;
			case 'landmineMirror':
				doNotGetAnyCloser('facingCamera', raycaster, camera, clock);
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
			// case 'claymoreBath':
			// 	if (monsterState !== 'facingCamera') {
			// 		setMonsterState('facingCamera');
			// 	}
			// 	closeTheDoorQuickly(bathroomCurtains[playerPositionRoom], clock);
			// 	break;
			case 'claymoreDesk':
				closeTheDoorQuickly(deskDoors[playerPositionRoom], clock);
				checkObjectiveAndAttack(interfaceObjectives, 1);
				break;
			case 'claymoreNightstand':
				closeTheDoorQuickly(nightstandDoors[playerPositionRoom], clock);
				checkObjectiveAndAttack(interfaceObjectives, 1);
				break;
			case 'claymoreBathroom':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				closeTheDoorQuickly(bathroomDoors[playerPositionRoom], clock);
				break;

			case 'hunterLivingRoom':
			case 'hunterCeilingLivingRoom':
			case 'hunterCeilingCouch': {
				const currentRoomDoorState = roomDoors[playerPositionRoom];
				const isDoorClosed = !currentRoomDoorState;
				const isInCurrentRoom =
					Object.keys(seedData)[playerPositionRoom] === 'hunterLivingRoom' ||
					Object.keys(seedData)[playerPositionRoom] ===
						'hunterCeilingLivingRoom' ||
					Object.keys(seedData)[playerPositionRoom] === 'hunterCeilingCouch';

				if (
					isDoorClosed &&
					hunterTriggeredRoomsRef.current[playerPositionRoom]
				) {
					hunterDoorClosedFromOutsideRef.current[playerPositionRoom] = true;
				}

				if (isDoorClosed && isInCurrentRoom) {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');

						if (Object.values(seedData)[playerPositionRoom].ceiling) {
							playAnimation('CeilingCrawlIdle');
						} else {
							playAnimation('Idle');
						}
					}
				} else if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					hunterTriggeredRoomsRef.current[playerPositionRoom] = true;

					if (monsterState !== 'chase') {
						setAnimationMixSpeed(2);
						setMonsterState('chase');
						setAnimationSpeed(0.5);
					}
				} else if (
					currentRoomDoorState &&
					hunterTriggeredRoomsRef.current[playerPositionRoom] &&
					hunterDoorClosedFromOutsideRef.current[playerPositionRoom] === true
				) {
					monsterAttack();
				}
				break;
			}

			case 'hunterNightstand': {
				const isDoorClosed = !roomDoors[playerPositionRoom];
				const isInCurrentRoom =
					Object.values(seedData)[playerPositionRoom]?.baseKey ===
					'hunterNightstand';

				if (isDoorClosed && isInCurrentRoom) {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');
						playAnimation('Crouch');
					}
				} else if (nightstandDoors[playerPositionRoom]) {
					if (monsterState !== 'chase') {
						setAnimationMixSpeed(2);
						setMonsterState('chase');
						playAnimation('Walk');
						setAnimationSpeed(0.6);
					}
				} else {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');
						playAnimation('Crouch');
					}
				}

				if (
					playerIsInsideZone(zoneBox, raycaster, camera) &&
					!nightstandDoors[playerPositionRoom]
				) {
					setNightStands(playerPositionRoom, true);
				}
				break;
			}

			case 'hunterWindow': {
				const isDoorClosed = !roomDoors[playerPositionRoom];
				const isInCurrentRoom =
					Object.values(seedData)[playerPositionRoom]?.baseKey ===
					'hunterWindow';

				if (isDoorClosed && isInCurrentRoom) {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');
						playAnimation('Crouch');
					}
				} else if (roomCurtains[playerPositionRoom]) {
					if (monsterState !== 'chase') {
						setAnimationMixSpeed(2);
						setMonsterState('chase');
						playAnimation('Walk');
						setAnimationSpeed(0.6);
					}
				} else {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');
						playAnimation('Crouch');
					}

					if (playerIsInsideZone(zoneBox, raycaster, camera)) {
						setRoomCurtains(playerPositionRoom, true);
						setRoomCurtain(true);
					}
				}
				break;
			}

			case 'raidTV': {
				if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (!tv && !knockedRooms.includes(playerPositionRoom)) {
						setTv(true);
						setActiveTvs(playerPositionRoom);

						setActiveRaid(playerPositionRoom, true);

						setTimeout(() => {
							triggerRAID(playerPositionRoom);
						}, 2000);
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

						setTimeout(() => {
							triggerRAID(playerPositionRoom);
						}, 2000);
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
						}, 6000);
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

	return null;
}
