import * as THREE from 'three';

const lookingDown = new THREE.Vector3(0, -1, 0);
const cameraDirection = new THREE.Vector3();
const angleThreshold = Math.PI / 3;

const SHAKE_INCREASE_RATE = 0.8;
const SHAKE_DECREASE_RATE = 1.0;
const SHAKE_THRESHOLD = 0.008;

let shakeDelayTimer = 0;

export const getMonsterInitialPosition = (
	playerPositionRoom,
	roomCount,
	position,
	controlsPosition
) => {
	const isFacingRoom = playerPositionRoom >= roomCount / 2;
	const initialPosition = [
		position[0] + (controlsPosition[0] || 0),
		position[1] + (controlsPosition[1] || 0),
		position[2] + (controlsPosition[2] || 0),
	];

	return getAdjustedPosition(
		initialPosition,
		isFacingRoom,
		playerPositionRoom,
		roomCount
	);
};

export const getAdjustedPosition = (initialPosition, isFacingRoom) => {
	if (!isFacingRoom) return initialPosition;
	return [-initialPosition[0], initialPosition[1], -initialPosition[2]];
};

export const getLookAtPointPosition = (
	lookAtPoint,
	playerPositionRoom,
	roomCount,
	position
) => {
	if (!lookAtPoint) return null;

	const isFacingRoom = playerPositionRoom >= roomCount / 2;

	const x = lookAtPoint[0] + position[0];
	const y = lookAtPoint[1];
	const z = lookAtPoint[2] + position[2];

	if (isFacingRoom) {
		return new THREE.Vector3(-x, y, -z);
	}

	return new THREE.Vector3(x, y, z);
};

export const playerIsLookingAtBox = (box, camera, crouch) => {
	if (!box?.current) return false;

	const playerIsCrouching = camera.position.y < 1;

	camera.getWorldDirection(cameraDirection);

	const center = new THREE.Vector3();
	box.current.getCenter(center);

	const direction = new THREE.Vector3()
		.subVectors(center, camera.position)
		.normalize();
	const angleToBox = cameraDirection.angleTo(direction);
	return angleToBox < angleThreshold && (crouch ? playerIsCrouching : true);
};

export const playerIsInsideZone = (box, raycaster, camera) => {
	if (!box.current) return false;

	camera.getWorldDirection(cameraDirection);
	raycaster.set(camera.position, lookingDown);
	return raycaster.ray.intersectsBox(box.current);
};

export const placeMonsterAtSecondPosition = (
	seedData,
	playerPositionRoom,
	setMonsterState,
	setMonsterPosition,
	position,
	roomCount,
	setMonsterRotation
) => {
	setMonsterState('facingCamera');

	const monsterInitialPosition =
		Object.values(seedData)[playerPositionRoom]?.monsterInitialPosition;
	const monsterInitialRotation =
		Object.values(seedData)[playerPositionRoom]?.monsterInitialRotation;

	if (monsterInitialPosition) {
		let roomX;
		if (playerPositionRoom >= roomCount / 2) {
			roomX = -(playerPositionRoom - roomCount / 2) * 5.95;
		} else {
			roomX = -playerPositionRoom * 5.95;
		}

		setMonsterPosition([
			monsterInitialPosition[0] + roomX + position[0],
			monsterInitialPosition[1] || 0,
			monsterInitialPosition[2] + position[2],
		]);

		if (monsterInitialRotation && setMonsterRotation) {
			const isFacingRoom = playerPositionRoom >= roomCount / 2;
			setMonsterRotation([
				monsterInitialRotation[0] * (isFacingRoom ? -1 : 1),
				monsterInitialRotation[1] + (isFacingRoom ? Math.PI : 0),
				monsterInitialRotation[2],
			]);
		}
	}
};

export const shakeCamera = (
	clock,
	shouldShake,
	setShakeIntensity,
	shakeIntensity,
	delayed
) => {
	const deltaTime = clock.getDelta();

	// console.log('shakeCamera', shouldShake, shakeIntensity);
	if (shouldShake) {
		if (delayed) {
			shakeDelayTimer += deltaTime;
			console.log('shakeDelayTimer', shakeDelayTimer);
			setShakeIntensity(
				Math.min(10, shakeIntensity + SHAKE_INCREASE_RATE * deltaTime * 60)
			);
			if (shakeDelayTimer > SHAKE_THRESHOLD) {
				shakeDelayTimer = 0;
				return true;
			}
		} else {
			setShakeIntensity(
				Math.min(10, shakeIntensity + SHAKE_INCREASE_RATE * deltaTime * 60)
			);
			return shakeIntensity > SHAKE_THRESHOLD;
		}
	} else {
		if (shakeIntensity > 0) {
			setShakeIntensity(
				Math.max(0, shakeIntensity - SHAKE_DECREASE_RATE * deltaTime * 60)
			);
		}
		shakeDelayTimer = 0;
	}

	return false;
};
