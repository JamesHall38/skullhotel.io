import { useRef, useMemo, useEffect, useCallback } from 'react';
import { PositionalAudio, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useInterface from '../../hooks/useInterface';

export default function DoubleCurtain({
	modelPath = '/models/doors/curtain.glb',
	material,
	position,
	rotation = [0, 0, 0],
	isCurtainOpen,
	curtains,
	setCurtain,
	setCurtains,
	roomNumber,
	soundUrl = '/sounds/curtain.ogg',
	meshPositions = {
		mesh0: [1, 1, -5.5],
		mesh1: [1, 1, -5.5],
	},
	primitivePositions = {
		left: [-1.28, 1.1, -5.35],
		right: [-1.7, 1.1, -5.32],
	},
	meshTargets = {
		mesh0: {
			open: 2.4,
			closed: 1.95,
		},
		mesh1: {
			open: 0.35,
			closed: 0.625,
		},
	},
	meshScales = {
		open: 0.6,
		closed: 1.1,
	},
}) {
	const group = useRef();
	const mixerRightRef = useRef(new THREE.AnimationMixer(null));
	const mixerLeftRef = useRef(new THREE.AnimationMixer(null));
	const { camera } = useThree();
	const curtainSoundRef = useRef();
	const mesh0Ref = useRef();
	const mesh1Ref = useRef();
	const setCursor = useInterface((state) => state.setCursor);
	const cursor = useInterface((state) => state.cursor);
	const prevDetectedRef = useRef(false);
	const cursorStateRef = useRef(null);
	const isInitial = useRef(true);
	const curtainsRef = useRef();
	const roomNumberRef = useRef();

	const { nodes, animations } = useGLTF(modelPath);

	const curtainMaterial = useMemo(() => {
		if (material) {
			return material;
		}
		return new THREE.MeshStandardMaterial({
			color: '#808080',
		});
	}, [material]);

	const animationMeshCloneLeft = useMemo(() => {
		const clone = nodes.Curtain.clone();
		clone.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
		clone.material = curtainMaterial;
		return clone;
	}, [nodes, curtainMaterial]);

	const animationMeshCloneRight = useMemo(() => {
		const clone = nodes.Curtain.clone();
		clone.material = curtainMaterial;
		return clone;
	}, [nodes, curtainMaterial]);

	const mixer = useMemo(
		() => new THREE.AnimationMixer(animationMeshCloneRight),
		[animationMeshCloneRight]
	);
	const mixerSecond = useMemo(
		() => new THREE.AnimationMixer(animationMeshCloneLeft),
		[animationMeshCloneLeft]
	);

	useEffect(() => {
		roomNumberRef.current = roomNumber;
	}, [roomNumber]);

	useEffect(() => {
		curtainsRef.current = curtains;
	}, [curtains]);

	const configureAction = useCallback(
		(action, timeScale = 1, startTime = null) => {
			action.clampWhenFinished = true;
			action.timeScale = timeScale;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;
			action.paused = false;

			if (startTime !== null && action.time < startTime) {
				action.time = startTime;
			}

			action.play();
		},
		[]
	);

	const handleCurtainAnimation = useCallback(
		(timeScale = 1, startTime = null) => {
			animations.forEach((clip) => {
				const actionRight = mixer.clipAction(clip);
				const actionLeft = mixerSecond.clipAction(clip);

				configureAction(actionRight, timeScale, startTime);
				configureAction(actionLeft, timeScale, startTime);
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		},
		[animations, mixer, mixerSecond, configureAction]
	);

	const openCurtain = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.play();
		}, 500);

		setCurtains(roomNumberRef.current, true);
		handleCurtainAnimation(1, 1);
	}, [handleCurtainAnimation, setCurtains]);

	const closeCurtain = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.currentTime = 0;
			curtainSoundRef.current.play();
		}, 500);

		setCurtains(roomNumberRef.current, false);
		handleCurtainAnimation(-1);
	}, [handleCurtainAnimation, setCurtains]);

	useEffect(() => {
		if (isCurtainOpen && Math.abs(camera.position.z) > 0.4) {
			openCurtain();
		} else if (!isCurtainOpen && Math.abs(camera.position.z) > 0.4) {
			if (isInitial.current) {
				isInitial.current = false;
			} else {
				closeCurtain();
			}
		}
	}, [isCurtainOpen, openCurtain, closeCurtain, camera]);

	useEffect(() => {
		if (curtainsRef.current[roomNumber]) {
			setCurtain(true);
			handleCurtainAnimation(1, 1);
		} else {
			setCurtain(false);
			handleCurtainAnimation(-1);
		}
	}, [roomNumber, setCurtain, handleCurtainAnimation]);

	const checkProximityAndVisibility = useCallback(() => {
		const cameraPosition = new THREE.Vector3();
		camera.getWorldPosition(cameraPosition);

		const checkMesh = (meshRef) => {
			if (!meshRef.current) return false;

			const meshPosition = new THREE.Vector3();
			meshRef.current.getWorldPosition(meshPosition);

			const distanceFromMesh = cameraPosition.distanceTo(meshPosition);

			if (distanceFromMesh > 2) return false;

			const raycaster = new THREE.Raycaster();
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);

			raycaster.set(cameraPosition, cameraDirection);

			const intersects = raycaster.intersectObjects([
				mesh0Ref.current,
				mesh1Ref.current,
			]);

			return intersects.some(
				(intersect) => intersect.object === meshRef.current
			);
		};

		return checkMesh(mesh0Ref) || checkMesh(mesh1Ref);
	}, [camera]);

	useFrame(() => {
		const detected = checkProximityAndVisibility();
		if (detected !== prevDetectedRef.current) {
			prevDetectedRef.current = detected;
			const newCursorState = detected
				? 'door'
				: cursor !== 'door'
				? cursor
				: null;

			if (cursorStateRef.current !== newCursorState) {
				cursorStateRef.current = newCursorState;
				setCursor(newCursorState);
			}
		}
	});

	useEffect(() => {
		const handleDocumentClick = () => {
			if (checkProximityAndVisibility()) {
				setCurtain(!isCurtainOpen);
			}
		};

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [checkProximityAndVisibility, setCurtain, isCurtainOpen]);

	const easeInQuad = (t) => t * t;
	let time0 = 0;
	let time1 = 0;

	useFrame(() => {
		time0 += 0.004;
		if (time0 > 1) time0 = 1;
		const easedTime = easeInQuad(time0);

		const targetX = isCurtainOpen
			? meshTargets.mesh0.open
			: meshTargets.mesh0.closed;
		const targetScaleX = isCurtainOpen ? meshScales.open : meshScales.closed;

		const currentX = mesh0Ref.current.position.x;
		const currentScaleX = mesh0Ref.current.scale.x;

		mesh0Ref.current.position.x = currentX + (targetX - currentX) * easedTime;
		mesh0Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime;
	});

	useFrame(() => {
		time1 += 0.004;
		if (time1 > 1) time1 = 1;
		const easedTime = easeInQuad(time1);

		const targetX = isCurtainOpen
			? meshTargets.mesh1.open
			: meshTargets.mesh1.closed;
		const targetScaleX = isCurtainOpen ? meshScales.open : meshScales.closed;

		const currentX = mesh1Ref.current.position.x;
		const currentScaleX = mesh1Ref.current.scale.x;

		mesh1Ref.current.position.x = currentX + (targetX - currentX) * easedTime;
		mesh1Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime;
	});

	useFrame((_, delta) => {
		if (mixerRightRef.current) {
			mixerRightRef.current.update(delta);
		}
		if (mixerLeftRef.current) {
			mixerLeftRef.current.update(delta);
		}
	});

	return (
		<group ref={group} position={position} rotation={rotation} dispose={null}>
			<group name="Scene">
				<primitive
					position={primitivePositions.left}
					castShadow
					receiveShadow
					object={animationMeshCloneLeft}
				/>
				<primitive
					position={primitivePositions.right}
					castShadow
					receiveShadow
					object={animationMeshCloneRight}
				/>
			</group>
			<PositionalAudio
				ref={curtainSoundRef}
				url={soundUrl}
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.25}
			/>
			<group position={[-2.86, 0, 0]}>
				<mesh ref={mesh0Ref} position={meshPositions.mesh0}>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="red" visible={false} />
				</mesh>
				<mesh ref={mesh1Ref} position={meshPositions.mesh1}>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="blue" visible={false} />
				</mesh>
			</group>
		</group>
	);
}

useGLTF.preload('/models/doors/curtain.glb');
