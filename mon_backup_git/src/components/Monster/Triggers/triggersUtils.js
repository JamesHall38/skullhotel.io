import * as THREE from 'three';

const lookingDown = new THREE.Vector3(0, -1, 0);
const cameraDirection = new THREE.Vector3();
const angleThreshold = Math.PI / 3;

let accumulatedDelta = 0;

export const getMonsterInitialPosition = (
	playerPositionRoom,
	roomTotal,
	position,
	controlsPosition
) => {
	const isFacingRoom = playerPositionRoom >= roomTotal / 2;
	const initialPosition = [
		position[0] + (controlsPosition[0] || 0),
		position[1] + (controlsPosition[1] || 0),
		position[2] + (controlsPosition[2] || 0),
	];

	return getAdjustedPosition(
		initialPosition,
		isFacingRoom,
		playerPositionRoom,
		roomTotal
	);
};

export const getAdjustedPosition = (
	initialPosition,
	isFacingRoom
	// playerPositionRoom,
	// roomTotal
) => {
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

const SHAKE_SPEED = 1;

export const shakeCamera = (
	clock,
	condition,
	setShakeIntensity,
	shakeIntensity
) => {
	if (condition) {
		if (shakeIntensity < 10) {
			accumulatedDelta += clock.getDelta() * 200;

			if (accumulatedDelta > SHAKE_SPEED) {
				setShakeIntensity(Math.min(10, shakeIntensity + accumulatedDelta));
				accumulatedDelta = 0;
			}
		} else {
			accumulatedDelta = 0;
			return true;
		}
	} else {
		if (shakeIntensity > 0) {
			accumulatedDelta += clock.getDelta() * 200;
			if (accumulatedDelta > SHAKE_SPEED) {
				setShakeIntensity(Math.max(0, shakeIntensity - accumulatedDelta));
				accumulatedDelta = 0;
			}
		}
	}
};

export const placeMonsterAtSecondPosition = (
	seedData,
	playerPositionRoom,
	setMonsterState,
	setMonsterPosition,
	position,
	roomTotal
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
			playerPositionRoom >= roomTotal / 2,
			playerPositionRoom,
			roomTotal
		)
	);
};
