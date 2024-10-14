import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';

const lookingDown = new THREE.Vector3(0, -1, 0);
const cameraDirection = new THREE.Vector3();
const JUMPSCARE_DELAY = 2000;
const angleThreshold = Math.PI / 3;

export default function TriggersConditions({
	monsterBox,
	zoneBox,
	instantBox,
	position,
}) {
	const [firstOpening, setFirstOpening] = useState(false);
	const [secondOpening, setSecondOpening] = useState(false);
	const [lookCount, setLookCount] = useState(0);
	const [wasLookingAtMonster, setWasLookingAtMonster] = useState(false);
	const isInit = useRef(false);
	const timeoutRef = useRef(null);

	// Game
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);

	// Interface
	const interfaceObjectives = useInterface(
		(state) => state.interfaceObjectives
	);

	// Monster
	const playAnimation = useMonster((state) => state.playAnimation);
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);

	// Doors
	const bathroomDoor = useDoor((state) => state.bathroomDoor);
	const setBathroomDoor = useDoor((state) => state.setBathroomDoor);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const nightStand = useDoor((state) => state.nightStand);
	const setNightStand = useDoor((state) => state.setNightStand);
	const roomDoor = useDoor((state) => state.roomDoor);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const desk = useDoor((state) => state.desk);

	const type = seedData[playerPositionRoom]?.type || 0;
	const number = seedData[playerPositionRoom]?.number || 0;

	useEffect(() => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return undefined;
		if (
			firstOpening &&
			((seedData[playerPositionRoom].trigger?.window && !roomCurtain) ||
				(seedData[playerPositionRoom].trigger?.bath && !bathroomCurtain) ||
				(seedData[playerPositionRoom].trigger?.door &&
					!roomDoor[playerPositionRoom]) ||
				(seedData[playerPositionRoom].trigger?.bathroom && !bathroomDoor) ||
				(seedData[playerPositionRoom].trigger?.desk && !desk) ||
				(seedData[playerPositionRoom].trigger?.bed && !nightStand))
		) {
			setSecondOpening(true);
		}
	}, [
		seedData,
		roomCurtain,
		playerPositionRoom,
		bathroomCurtain,
		roomDoor,
		bathroomDoor,
		desk,
		nightStand,
		firstOpening,
	]);

	useEffect(() => {
		setLookCount(0);
		setWasLookingAtMonster(false);
		setSecondOpening(false);
		setFirstOpening(false);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [playerPositionRoom]);

	// 0
	const hiddingSpotTriggers = (camera, raycaster) => {
		if (number === 5) {
			raycaster.set(camera.position, lookingDown);

			if (
				(Math.abs(camera.position.z) > 3 && !roomDoor[playerPositionRoom]) ||
				raycaster.ray.intersectsBox(monsterBox.current) ||
				raycaster.ray.intersectsBox(zoneBox.current)
			) {
				playAnimation('Run');
				setMonsterState('run');
			}
		} else {
			if (
				interfaceObjectives[playerPositionRoom]?.[
					seedData[playerPositionRoom].trigger?.objective
				]
			) {
				if (seedData[playerPositionRoom].trigger?.bathroomDoor) {
					setBathroomDoor(true);
				}

				raycaster.set(camera.position, cameraDirection);
				if (
					monsterBox.current &&
					raycaster.ray.intersectsBox(monsterBox.current)
				) {
					playAnimation('Run');
					setMonsterState('run');
				}
				raycaster.set(camera.position, lookingDown);
				if (zoneBox.current && raycaster.ray.intersectsBox(zoneBox.current)) {
					playAnimation('Run');
					setMonsterState('run');
				}
			}
		}
	};

	// 1
	const cornerFrames = (camera, raycaster) => {
		if (number === 11) {
			if (Math.abs(camera.position.z) > 1.5) {
				playAnimation('Vent');
			}
		}
		if (
			interfaceObjectives[playerPositionRoom]?.[
				seedData[playerPositionRoom].trigger?.objective
			]
		) {
			playAnimation('Run');
			setMonsterState('run');
		}
		if (
			number === 7 ||
			number === 8 ||
			number === 9 ||
			number === 10 ||
			number === 11
		) {
			raycaster.set(camera.position, lookingDown);
			if (raycaster.ray.intersectsBox(instantBox.current)) {
				if (number === 10 || number === 11) {
					if (monsterPosition[1] > 2.9) {
						setMonsterPosition([
							monsterPosition[0] + (number === 11 ? 0.8 : 0),
							0,
							monsterPosition[2],
						]);
					} else {
						playAnimation('Run');
						setMonsterState('run');
					}
				} else {
					playAnimation('Run');
					setMonsterState('run');
				}
			}
		} else if (instantBox.current) {
			raycaster.set(camera.position, lookingDown);
			if (
				raycaster.ray.intersectsBox(instantBox.current) ||
				raycaster.ray.intersectsBox(zoneBox.current)
			) {
				playAnimation('Run');
				setMonsterState('run');
			} else if (
				seedData[playerPositionRoom].trigger?.monster &&
				raycaster.ray.intersectsBox(monsterBox.current)
			) {
				playAnimation('Run');
				setMonsterState('run');
			}
		}
	};

	// 2
	const closedDoorTriggers = (camera, raycaster) => {
		if (seedData[playerPositionRoom].trigger?.window && roomCurtain) {
			setTimeout(() => {
				playAnimation('Attack');
				setMonsterState('run');
			}, 200);
		} else if (
			((seedData[playerPositionRoom].trigger?.bath && bathroomCurtain) ||
				(seedData[playerPositionRoom].trigger?.door &&
					roomDoor[playerPositionRoom]) ||
				(seedData[playerPositionRoom].trigger?.bathroom && bathroomDoor) ||
				(seedData[playerPositionRoom].trigger?.desk && desk) ||
				(seedData[playerPositionRoom].trigger?.bed && nightStand)) &&
			(Math.abs(camera.position.z) > 1.5 ||
				seedData[playerPositionRoom].trigger?.door)
		) {
			playAnimation('Run');
			setMonsterState('run');
		}
		raycaster.set(camera.position, lookingDown);
		if (monsterBox.current && raycaster.ray.intersectsBox(monsterBox.current)) {
			if (seedData[playerPositionRoom].trigger?.window) {
				setRoomCurtain(true);
			} else {
				playAnimation('Run');
				setMonsterState('run');
			}
		}
	};

	// 3
	const openedDoorTriggers = (camera, raycaster) => {
		raycaster.set(camera.position, lookingDown);
		if (monsterBox.current && raycaster.ray.intersectsBox(monsterBox.current)) {
			playAnimation('Run');
			setMonsterState('run');
		}
		const trigger = seedData[playerPositionRoom].trigger;
		const conditionMet =
			(trigger?.window && roomCurtain) ||
			(trigger?.bath && bathroomCurtain) ||
			(trigger?.door && roomDoor[playerPositionRoom]) ||
			(trigger?.bathroom && bathroomDoor) ||
			(trigger?.desk && desk) ||
			(trigger?.bed && nightStand);

		if (conditionMet && secondOpening) {
			playAnimation('Run');
			setMonsterState('run');
		} else if (conditionMet) {
			setFirstOpening(true);
			if (!timeoutRef.current) {
				timeoutRef.current = setTimeout(() => {
					playAnimation('Run');
					setMonsterState('run');
					timeoutRef.current = null;
				}, JUMPSCARE_DELAY);
			}
		} else {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		}
	};

	// 4
	const visualTriggers = (camera, raycaster) => {
		raycaster.set(camera.position, cameraDirection);
		if (number === 3) {
			raycaster.set(camera.position, lookingDown);
			if (zoneBox.current && raycaster.ray.intersectsBox(zoneBox.current)) {
				playAnimation('Attack');
				setMonsterState('run');
			}
		} else if (number === 4) {
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);

			const playerIsInTheCorridor =
				Math.abs(camera.position.x) - Math.abs(position[0]) > 1.8;
			const playerIsBathroomSide = Math.abs(camera.position.z) < 4.8;
			if (
				number === 4 &&
				Math.abs(camera.position.z) < 4 &&
				((bathroomDoor && playerIsInTheCorridor) ||
					(!playerIsInTheCorridor && playerIsBathroomSide))
			) {
				const monsterDirection = new THREE.Vector3()
					.subVectors(
						monsterBox.current.getCenter(new THREE.Vector3()),
						camera.position
					)
					.normalize();

				const angleToMonster = cameraDirection.angleTo(monsterDirection);
				const isLookingAtMonster = angleToMonster < angleThreshold;

				if (isLookingAtMonster && !wasLookingAtMonster) {
					setWasLookingAtMonster(true);
				} else if (!isLookingAtMonster && wasLookingAtMonster) {
					setWasLookingAtMonster(false);
					setLookCount((prev) => prev + 1);
					setMonsterPosition([
						monsterPosition[0] - 2,
						monsterPosition[1],
						monsterPosition[2] + 0.4,
					]);
				}

				if (lookCount === 3 && playerIsBathroomSide && !playerIsInTheCorridor) {
					playAnimation('Attack');
					setMonsterState('run');
				}

				if (lookCount > 3 && bathroomDoor && isLookingAtMonster) {
					playAnimation('Attack');
					setMonsterState('run');
				}
			}
		} else if (number === 5) {
			const monsterDirection = new THREE.Vector3()
				.subVectors(
					monsterBox.current.getCenter(new THREE.Vector3()),
					camera.position
				)
				.normalize();

			const angleToMonster = cameraDirection.angleTo(monsterDirection);
			const isLookingAtMonster = angleToMonster < angleThreshold;
			const playerIsBathroomSide = Math.abs(camera.position.z) < 4.8;
			const playerIsInTheCorridor =
				Math.abs(camera.position.x) - Math.abs(position[0]) > 1.8;

			if (
				isLookingAtMonster &&
				((playerIsBathroomSide && !playerIsInTheCorridor) ||
					(bathroomDoor && playerIsBathroomSide))
			) {
				setMonsterState('chase');
				playAnimation('Walk');
			}
		} else if (
			monsterBox.current &&
			raycaster.ray?.intersectsBox(monsterBox.current) &&
			((seedData[playerPositionRoom].trigger?.bath && bathroomCurtain) ||
				(seedData[playerPositionRoom].trigger?.door &&
					roomDoor[playerPositionRoom]) ||
				(seedData[playerPositionRoom].trigger?.bathroom && bathroomDoor) ||
				seedData[playerPositionRoom].trigger?.monster)
		) {
			raycaster.set(camera.position, lookingDown);
			if (raycaster.ray.intersectsBox(zoneBox.current)) {
				playAnimation('Attack');
				setMonsterState('run');
			}
			if (number === 1 || number === 2) {
				playAnimation('Attack');
				setMonsterState('run');
			}
		}
		if (number === 1 || number === 2) {
			raycaster.set(camera.position, lookingDown);
			if (zoneBox.current && raycaster.ray?.intersectsBox(zoneBox.current)) {
				playAnimation('Attack');
				setMonsterState('run');
			}
		}
	};

	// 5
	const specialTriggers = (camera, raycaster) => {
		raycaster.set(camera.position, lookingDown);
		if (
			(((number === 0 || number === 5) && roomDoor[playerPositionRoom]) ||
				(zoneBox.current && raycaster.ray.intersectsBox(zoneBox.current))) &&
			isInit.current
		) {
			if (monsterState !== 'chase' && monsterState !== 'crawl') {
				playAnimation(number > 2 ? 'CeilingCrawl' : 'Walk');
				setMonsterState(number > 2 ? 'crawl' : 'chase');

				if (!roomCurtain && seedData[playerPositionRoom].trigger?.roomCurtain) {
					setRoomCurtain(true);
				}
				if (!nightStand && seedData[playerPositionRoom].trigger?.nightStand) {
					setNightStand(true);
				}
			}
		} else if (monsterState !== 'idle') {
			playAnimation(seedData[playerPositionRoom].animation || 'Idle');
		}
		if (
			(zoneBox.current && raycaster.ray.intersectsBox(zoneBox.current)) ||
			number === 0 ||
			number === 5
		) {
			isInit.current = true;
		}
	};

	useFrame(({ camera, raycaster }) => {
		if (!seedData[playerPositionRoom] || seedData[playerPositionRoom]?.empty)
			return null;
		camera.getWorldDirection(cameraDirection);

		if (
			(monsterState === 'hidden' ||
				monsterState === 'frozen' ||
				monsterState === 'idle') &&
			camera.position.x < 2
		) {
			if (type === 0) {
				hiddingSpotTriggers(camera, raycaster);
			} else if (type === 1) {
				cornerFrames(camera, raycaster);
			} else if (type === 2) {
				closedDoorTriggers(camera, raycaster);
			} else if (type === 3) {
				openedDoorTriggers(camera, raycaster);
			} else if (type === 4) {
				visualTriggers(camera, raycaster);
			} else if (type === 5) {
				specialTriggers(camera, raycaster);
			}
		}
	});

	return null;
}
