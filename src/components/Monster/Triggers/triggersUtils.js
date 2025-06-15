import * as THREE from 'three';

const lookingDown = new THREE.Vector3(0, -1, 0);
const cameraDirection = new THREE.Vector3();
const angleThreshold = Math.PI / 3;

const SHAKE_INCREASE_RATE = 0.8;
const SHAKE_DECREASE_RATE = 1.0;
const SHAKE_THRESHOLD = 0.008;

const SHAKE_DURATION_MS = 2000;
let shakeStartTime = 0;

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

	return getAdjustedPosition(initialPosition, isFacingRoom);
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
		const newPosition = getMonsterInitialPosition(
			playerPositionRoom,
			roomCount,
			position,
			monsterInitialPosition
		);

		setMonsterPosition([newPosition[0], newPosition[1], newPosition[2]]);

		if (monsterInitialRotation && setMonsterRotation) {
			setMonsterRotation([
				monsterInitialRotation[0] *
					(playerPositionRoom >= roomCount / 2 ? -1 : 1),
				monsterInitialRotation[1] +
					(playerPositionRoom >= roomCount / 2 ? Math.PI : 0),
				monsterInitialRotation[2] +
					(playerPositionRoom >= roomCount / 2 ? 0 : 0),
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
	const currentTime = performance.now();

	if (shouldShake) {
		if (delayed) {
			if (shakeStartTime === 0) {
				shakeStartTime = currentTime;
			}

			const timeElapsed = currentTime - shakeStartTime;
			if (timeElapsed > SHAKE_DURATION_MS) {
				setShakeIntensity(10);
				shakeStartTime = 0;
				return true;
			}
		} else {
			setShakeIntensity(
				Math.min(10, shakeIntensity + SHAKE_INCREASE_RATE * deltaTime * 60)
			);
			return shakeIntensity > SHAKE_THRESHOLD;
		}
	} else {
		shakeStartTime = 0;

		if (shakeIntensity > 0) {
			setShakeIntensity(
				Math.max(0, shakeIntensity - SHAKE_DECREASE_RATE * deltaTime * 60)
			);
		}
	}

	return false;
};
