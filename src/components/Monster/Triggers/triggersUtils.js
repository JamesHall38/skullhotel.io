import * as THREE from 'three';

const lookingDown = new THREE.Vector3(0, -1, 0);
const cameraDirection = new THREE.Vector3();
const angleThreshold = Math.PI / 3;

const SHAKE_INCREASE_RATE = 0.8;
const SHAKE_DECREASE_RATE = 1.0;
const SHAKE_THRESHOLD = 0.015;

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

export const shakeCamera = (
	clock,
	condition,
	setShakeIntensity,
	shakeIntensity,
	delay = false
) => {
	const deltaTime = clock.getDelta();

	if (condition) {
		if (delay && shakeIntensity === 0) {
			shakeDelayTimer += deltaTime;

			if (shakeDelayTimer < 0.01) {
				return false;
			}
		}

		if (shakeIntensity < SHAKE_THRESHOLD) {
			const newIntensity = Math.min(
				10,
				shakeIntensity + SHAKE_INCREASE_RATE * deltaTime
			);
			setShakeIntensity(newIntensity);

			if (newIntensity >= SHAKE_THRESHOLD) {
				shakeDelayTimer = 0;
				return true;
			}
		} else {
			shakeDelayTimer = 0;
			return true;
		}
	} else {
		shakeDelayTimer = 0;
		if (shakeIntensity > 0) {
			setShakeIntensity(
				Math.max(0, shakeIntensity - SHAKE_DECREASE_RATE * deltaTime)
			);
		}
	}

	return false;
};

export const placeMonsterAtSecondPosition = (
	seedData,
	playerPositionRoom,
	setMonsterState,
	setMonsterPosition,
	position,
	roomCount
) => {
	setMonsterState('facingCamera');
	setMonsterPosition(
		getAdjustedPosition(
			[
				position[0] +
					(Object.values(seedData)[playerPositionRoom].monsterPosition?.[0] ||
						0),
				position[1] +
					(Object.values(seedData)[playerPositionRoom].monsterPosition?.[1] ||
						0),
				position[2] +
					(Object.values(seedData)[playerPositionRoom].monsterPosition?.[2] ||
						0),
			],
			playerPositionRoom >= roomCount / 2,
			playerPositionRoom,
			roomCount
		)
	);
};
