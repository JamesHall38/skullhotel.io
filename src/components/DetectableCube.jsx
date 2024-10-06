import { useRef, useCallback, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DetectableCube(props) {
	const {
		position,
		scale,
		distance = 2,
		onDetect,
		onDetectEnd,
		// number = 0,
	} = props;

	const cubeRef = useRef();
	const {
		camera,
		// , scene
	} = useThree();
	const prevDetectedRef = useRef(false);

	const geometry = useMemo(() => new THREE.BoxGeometry(), []);
	const material = useMemo(
		() => new THREE.MeshBasicMaterial({ color: 'red' }),
		[]
	);

	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const cameraDirection = useMemo(() => new THREE.Vector3(), []);

	const checkProximityAndVisibility = useCallback(() => {
		if (!cubeRef.current) return false;

		const cameraPosition = new THREE.Vector3();
		camera.getWorldPosition(cameraPosition);

		const cubePosition = new THREE.Vector3();
		cubeRef.current.getWorldPosition(cubePosition);

		const distanceFromCube = cameraPosition.distanceTo(cubePosition);

		if (distanceFromCube > distance) {
			return false;
		}

		camera.getWorldDirection(cameraDirection);

		raycaster.set(cameraPosition, cameraDirection);

		// const intersects = raycaster.intersectObjects(scene.children, true);
		const intersects = raycaster.intersectObject(cubeRef.current);

		return intersects.length > 0 && intersects[0].object === cubeRef.current;
	}, [camera, distance, cameraDirection, raycaster, cubeRef]);

	useFrame(() => {
		const detected = checkProximityAndVisibility();
		if (detected !== prevDetectedRef.current) {
			if (detected) {
				onDetect();
			} else {
				onDetectEnd();
			}
			prevDetectedRef.current = detected;
		}
	});

	return (
		<mesh
			ref={cubeRef}
			name="DetectableCube"
			position={position}
			scale={scale}
			geometry={geometry}
			material={material}
			visible={false}
			{...props}
		/>
	);
}
