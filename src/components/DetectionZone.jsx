import { useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useInterface from '../hooks/useInterface';

export default function DetectionZone(props) {
	const {
		name,
		type,
		position,
		scale,
		distance = 2,
		onDetect,
		onDetectEnd,
	} = props;

	const cursor = useInterface((state) => state.cursor);
	const cubeRef = useRef();
	const { camera } = useThree();

	const geometry = useMemo(() => new THREE.BoxGeometry(), []);
	const material = useMemo(
		() => new THREE.MeshBasicMaterial({ color: 'red' }),
		[]
	);

	const checkProximityAndVisibility = (camera) => {
		const cameraPosition = new THREE.Vector3();
		camera.getWorldPosition(cameraPosition);
		const raycaster = new THREE.Raycaster();
		raycaster.far = distance;
		const cameraDirection = new THREE.Vector3();
		camera.getWorldDirection(cameraDirection);

		raycaster.set(cameraPosition, cameraDirection);
		return raycaster.intersectObject(cubeRef.current).length;
	};

	let frameCount = 0;

	useFrame(() => {
		frameCount++;
		if (frameCount % 10 === 0) {
			const detected = checkProximityAndVisibility(camera);
			if (cursor === `${type}-${name}` && !detected) {
				onDetectEnd();
			} else if (
				cursor !== `${type}-${name}` &&
				!cursor?.includes('door') &&
				detected
			) {
				onDetect();
			}
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
