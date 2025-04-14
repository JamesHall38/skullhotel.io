import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

export const defaultCameraPoints = [
	{
		position: new THREE.Vector3(10.7, 1.5, -1),
		rotation: new THREE.Euler(0, Math.PI, 0),
		duration: 0.3,
		// duration: 3,
	}, // start
	{
		position: new THREE.Vector3(10.7, 1.5, -1),
		rotation: new THREE.Euler(0, Math.PI, 0),
		duration: 1,
	}, // start 2
	{
		position: new THREE.Vector3(1.8, 1.5, 7.9),
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		duration: 6,
	}, // skull
	{
		position: new THREE.Vector3(3, 1.5, 7.9),
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		duration: 4,
	}, // end
	{
		position: new THREE.Vector3(3, 1.5, 7.9),
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		duration: 0,
	}, // end 2
];

const useEndGameAnimation = create(
	subscribeWithSelector((set, get) => ({
		isPlaying: false,
		currentPointIndex: 0,
		progress: 0,
		initialDelay: 0.65,
		currentDelayTime: 0,

		initialTransition: {
			active: false,
			startPosition: new THREE.Vector3(),
			startRotation: new THREE.Euler(),
			duration: 0.25,
			progress: 0,
		},

		cameraPoints: [...defaultCameraPoints],

		currentPosition: new THREE.Vector3(),
		currentRotation: new THREE.Euler(),

		setPointFunction: (pointIndex, callback) => {
			set((state) => {
				const newPoints = [...state.cameraPoints];
				if (pointIndex >= 0 && pointIndex < newPoints.length) {
					newPoints[pointIndex] = {
						...newPoints[pointIndex],
						onReach: callback,
					};
				}
				return { cameraPoints: newPoints };
			});
		},

		setCameraPoints: (points) => {
			set({ cameraPoints: points });
		},

		getPointPosition: (pointIndex) => {
			const state = get();
			const points = state.cameraPoints;

			if (pointIndex >= 0 && pointIndex < points.length) {
				return points[pointIndex].position.clone();
			}

			return new THREE.Vector3(0, 0, 0);
		},

		startAnimation: (initialCameraPosition, initialCameraRotation) => {
			const state = get();
			const points = state.cameraPoints;
			if (points.length === 0) return;

			const startPosition = initialCameraPosition || new THREE.Vector3(0, 0, 0);
			const startRotation = initialCameraRotation || new THREE.Euler(0, 0, 0);

			set({
				isPlaying: true,
				currentPointIndex: 0,
				progress: 0,
				currentDelayTime: 0,
				initialTransition: {
					active: true,
					startPosition: startPosition.clone(),
					startRotation: startRotation.clone(),
					duration: 0.5,
					progress: 0,
				},
			});
		},

		stopAnimation: () => {
			set({
				isPlaying: false,
				currentPointIndex: 0,
				progress: 0,
				currentDelayTime: 0,
				initialTransition: {
					...get().initialTransition,
					active: false,
					progress: 0,
				},
			});
		},

		updateAnimation: (delta) => {
			const state = get();
			const points = state.cameraPoints;

			if (!state.isPlaying || points.length === 0) return;

			if (state.initialTransition.active) {
				const transition = state.initialTransition;
				const newProgress = transition.progress + delta / transition.duration;

				if (newProgress >= 1) {
					set({
						initialTransition: {
							...transition,
							active: false,
							progress: 0,
						},
						currentPosition: new THREE.Vector3().copy(points[0].position),
						currentRotation: new THREE.Euler().copy(points[0].rotation),
					});

					const firstPointCallback = points[0].onReach;
					if (firstPointCallback && typeof firstPointCallback === 'function') {
						firstPointCallback();
					}
				} else {
					const linearProgress = newProgress;

					const newPosition = new THREE.Vector3()
						.copy(transition.startPosition)
						.lerp(points[0].position, linearProgress);

					const newRotation = new THREE.Euler();
					const startQuaternion = new THREE.Quaternion().setFromEuler(
						transition.startRotation
					);
					const endQuaternion = new THREE.Quaternion().setFromEuler(
						points[0].rotation
					);
					const resultQuaternion = new THREE.Quaternion();

					resultQuaternion.slerpQuaternions(
						startQuaternion,
						endQuaternion,
						linearProgress
					);
					newRotation.setFromQuaternion(resultQuaternion);

					set({
						initialTransition: {
							...transition,
							progress: newProgress,
						},
						currentPosition: newPosition,
						currentRotation: newRotation,
					});
				}

				return;
			}

			if (
				state.currentPointIndex === 0 &&
				state.currentDelayTime < state.initialDelay
			) {
				set({ currentDelayTime: state.currentDelayTime + delta });
				return;
			}

			let newProgress =
				state.progress + delta / points[state.currentPointIndex].duration;

			if (newProgress >= 1) {
				const nextPointIndex = state.currentPointIndex + 1;

				if (nextPointIndex >= points.length) {
					set({
						isPlaying: false,
						currentPointIndex: 0,
						progress: 0,
						currentDelayTime: 0,
						initialTransition: {
							...state.initialTransition,
							active: false,
							progress: 0,
						},
					});
					return;
				}

				set({
					currentPointIndex: nextPointIndex,
					progress: 0,
				});

				const nextPointCallback = points[nextPointIndex].onReach;
				if (nextPointCallback && typeof nextPointCallback === 'function') {
					nextPointCallback();
				}

				return;
			}

			set({ progress: newProgress });

			const currentPoint = points[state.currentPointIndex];
			const nextPoint =
				state.currentPointIndex < points.length - 1
					? points[state.currentPointIndex + 1]
					: currentPoint;

			const linearProgress = state.progress;

			const newPosition = new THREE.Vector3()
				.copy(currentPoint.position)
				.lerp(nextPoint.position, linearProgress);

			const newRotation = new THREE.Euler();

			const startQuaternion = new THREE.Quaternion().setFromEuler(
				currentPoint.rotation
			);
			const endQuaternion = new THREE.Quaternion().setFromEuler(
				nextPoint.rotation
			);
			const resultQuaternion = new THREE.Quaternion();

			resultQuaternion.slerpQuaternions(
				startQuaternion,
				endQuaternion,
				linearProgress
			);
			newRotation.setFromQuaternion(resultQuaternion);

			set({
				currentPosition: newPosition,
				currentRotation: newRotation,
			});
		},

		getCameraPoints: () => get().cameraPoints,
	}))
);

export default useEndGameAnimation;
