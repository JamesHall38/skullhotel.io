import { useRef } from 'react';
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
	const roomTotal = useGame((state) => state.roomTotal);

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

	// Doors
	const roomDoors = useDoor((state) => state.roomDoor);
	const bathroomDoor = useDoor((state) => state.bathroomDoor);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const deskDoor = useDoor((state) => state.desk);
	const nightstandDoor = useDoor((state) => state.nightStand);

	const attackTimeoutRef = useRef(null);
	const quickTimeoutRef = useRef(null);
	const lookingTimeoutRef = useRef(null);

	const monsterAttack = () => {
		setShakeIntensity(10);
		setMonsterState('run');
		playAnimation('Run');
	};

	const basicHiding = (clock, camera, raycaster, useInstantBox = false) => {
		let monsterIsTriggered = false;
		if (interfaceObjectives[playerPositionRoom]?.[2]) {
			playAnimation('Idle');
			placeMonsterAtSecondPosition(
				seedData,
				playerPositionRoom,
				setMonsterState,
				setMonsterPosition,
				position,
				roomTotal
			);
			monsterIsTriggered = shakeCamera(
				clock,
				playerIsLookingAtBox(monsterBox, camera),
				setShakeIntensity,
				shakeIntensity
			);
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
				shakeIntensity
			);
		}

		if (
			(playerIsInsideZone(zoneBox, raycaster, camera) &&
				interfaceObjectives[playerPositionRoom]?.[2]) ||
			monsterIsTriggered
		) {
			monsterAttack();
		}
	};

	const doNotGetAnyCloser = (monsterStateValue, raycaster, camera, clock) => {
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
				shakeIntensity
			)
		) {
			setMonsterPosition([
				Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition[0] +
					position[0],
				0,
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

	function triggerMonsterAttack() {
		setMonsterPosition([
			Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition[0] +
				position[0],
			0,
			Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition[2] +
				position[2],
		]);
		monsterAttack();
	}

	useFrame(({ camera, raycaster, clock }) => {
		if (
			!Object.values(seedData)[playerPositionRoom] ||
			Object.values(seedData)[playerPositionRoom]?.type === 'empty' ||
			monsterState === 'run' ||
			camera.position.x > 3
		)
			return;

		switch (Object.keys(seedData)[playerPositionRoom]) {
			case 'underBed':
				basicHiding(clock, camera, raycaster, 'underBed');
				break;
			case 'bathroomVent':
			case 'roomVent':
				basicHiding(clock, camera, raycaster);
				break;
			case 'bedBasket':
			case 'windowBasket':
				basicHiding(clock, camera, raycaster, true);
				break;
			case 'behindDoor':
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
			case 'bathroomCorner':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				if (
					playerIsInsideZone(instantBox, raycaster, camera) ||
					shakeCamera(
						clock,
						playerIsInsideZone(cameraShakingBox, raycaster, camera) &&
							playerIsLookingAtBox(monsterBox, camera) &&
							bathroomDoor,
						setShakeIntensity,
						shakeIntensity
					)
				) {
					monsterAttack();
				}
				break;
			case 'nearBed':
			case 'nearWindow':
			case 'bedCorner':
			case 'windowCorner':
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
			case 'ceilingCornerBeforeBed':
			case 'ceilingCornerCouch':
			case 'behindCouch':
			case 'behindDesk':
			case 'insideDesk':
				doNotGetAnyCloser('hidden', raycaster, camera, clock);
				break;
			case 'ceilingCenter':
			case 'ceilingCenterCrouch':
				doNotGetAnyCloser('facingCamera', raycaster, camera, clock);
				break;
			case 'windowNoSound':
			case 'windowSound':
				if (roomCurtain) {
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			case 'bathSound':
				if (bathroomCurtain) {
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			case 'deskSound':
				if (deskDoor) {
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			case 'nightstandSound':
				if (nightstandDoor) {
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			case 'bathroomSound':
				if (bathroomDoor) {
					setTimeout(() => {
						monsterAttack();
					}, 500);
				}
				break;
			case 'quickWindow':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}

				closeTheDoorQuickly(roomCurtain, clock);
				break;
			case 'quickBath':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				closeTheDoorQuickly(bathroomCurtain, clock);
				break;
			case 'quickDesk':
				closeTheDoorQuickly(deskDoor, clock);
				break;
			case 'quickNightstand':
				closeTheDoorQuickly(nightstandDoor, clock);
				break;
			case 'quickBathroom':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				closeTheDoorQuickly(bathroomDoor, clock);
				break;
			case 'bloodOnBath':
				break;
			case 'bloodOnDoor':
				if (monsterState !== 'facingCamera') {
					setMonsterState('facingCamera');
				}
				if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (lookingTimeoutRef.current) {
						clearTimeout(lookingTimeoutRef.current);
						lookingTimeoutRef.current = null;
					}
					triggerMonsterAttack();
				} else if (playerIsLookingAtBox(monsterBox, camera)) {
					if (!lookingTimeoutRef.current) {
						lookingTimeoutRef.current = setTimeout(() => {
							triggerMonsterAttack();
							lookingTimeoutRef.current = null;
						}, 1000);
					}
				} else {
					if (lookingTimeoutRef.current) {
						clearTimeout(lookingTimeoutRef.current);
						lookingTimeoutRef.current = null;
					}
				}
				break;
			case 'runningWindowToDoor':
			case 'runningWindowCurtainToBed':
				const isInHallway = camera.position.x < 2;
				const isDoorClosed = !roomDoors[playerPositionRoom];

				if (isInHallway && isDoorClosed) {
					if (monsterState !== 'facingCamera') {
						setMonsterState('facingCamera');
						playAnimation('Idle');
					}
				} else if (
					isInHallway &&
					!isDoorClosed &&
					monsterState === 'facingCamera'
				) {
					monsterAttack();
				} else if (playerIsInsideZone(zoneBox, raycaster, camera)) {
					if (monsterState !== 'chase') {
						setMonsterState('chase');
						setAnimationSpeed(0.5);
					}
				}
				break;
			default:
				break;
		}
	});

	return null;
}
