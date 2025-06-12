import { useRef, useMemo, useEffect, useCallback } from 'react';
import { PositionalAudio, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import { usePositionalSound } from '../../utils/audio';
import useDoor from '../../hooks/useDoor';
import useGamepadControls from '../../hooks/useGamepadControls';

export default function DoubleCurtain({
	name,
	modelPath = '/models/doors/curtain.glb',
	material,
	position,
	rotation = [0, 0, 0],
	isCurtainOpen,
	curtains,
	setCurtain,
	setCurtains,
	roomNumber,
	meshPositions = {
		mesh0: [1, 1, -5.5],
		mesh1: [1, 1, -5.5],
	},
	primitivePositions = {
		left: [-1.28, 1.1, -5.35],
		right: [-1.7, 1.08, -5.32],
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
	const isInitial = useRef(true);
	const curtainsRef = useRef();
	const roomNumberRef = useRef();
	const mobileClick = useGame((state) => state.mobileClick);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const processedInFrameRef = useRef(false);
	const instantChangeRef = useRef(false);
	const isJustAfterDoorChangeRef = useRef(false);
	const roomDoors = useDoor((state) => state.roomDoor);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);

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

	const curtainSound = usePositionalSound('curtain');

	useEffect(() => {
		roomNumberRef.current = roomNumber;
	}, [roomNumber]);

	useEffect(() => {
		curtainsRef.current = curtains;
	}, [curtains]);

	useEffect(() => {
		isJustAfterDoorChangeRef.current = true;
		setTimeout(() => {
			isJustAfterDoorChangeRef.current = false;
		}, 2000);
	}, [roomDoors, roomNumber]);

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
		if (!instantChangeRef.current && !isJustAfterDoorChangeRef.current) {
			setTimeout(() => {
				curtainSoundRef.current.play();
			}, 500);
		}

		setCurtains(roomNumberRef.current, true);
		handleCurtainAnimation(1, 1);
	}, [handleCurtainAnimation, setCurtains]);

	const closeCurtain = useCallback(() => {
		if (!instantChangeRef.current && !isJustAfterDoorChangeRef.current) {
			setTimeout(() => {
				curtainSoundRef.current.currentTime = 0;
				curtainSoundRef.current.play();
			}, 500);
		}

		setCurtains(roomNumberRef.current, false);
		handleCurtainAnimation(-1);
	}, [handleCurtainAnimation, setCurtains]);

	useEffect(() => {
		if (isCurtainOpen) {
			openCurtain();
		} else if (!isCurtainOpen) {
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

	const checkProximityAndVisibility = useCallback(
		(camera) => {
			const cameraPosition = new THREE.Vector3();
			camera.getWorldPosition(cameraPosition);
			const raycaster = new THREE.Raycaster();
			raycaster.far = 2;
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);

			const meshes = [mesh0Ref.current, mesh1Ref.current];

			raycaster.set(cameraPosition, cameraDirection);
			raycaster.set(cameraPosition, cameraDirection);
			return raycaster.intersectObjects(meshes).length > 0;
		},
		[mesh0Ref, mesh1Ref]
	);

	useFrame(() => {
		instantChangeRef.current =
			Math.abs(camera.position.x) < 1 || isJustAfterDoorChangeRef.current;

		if (mixerRightRef.current) {
			mixerRightRef.current.timeScale = instantChangeRef.current ? 10 : 1;
		}
		if (mixerLeftRef.current) {
			mixerLeftRef.current.timeScale = instantChangeRef.current ? 10 : 1;
		}

		const detected = checkProximityAndVisibility(camera);
		const currentCursor =
			deviceMode === 'gamepad' ? `door-${name}-gamepad` : `door-${name}`;

		if (detected) {
			if (cursor !== currentCursor) {
				setCursor(currentCursor);
			}
		} else if (cursor === `door-${name}` || cursor === `door-${name}-gamepad`) {
			setCursor(null);
		}

		if (mobileClick && detected) {
			setCurtain(!isCurtainOpen);
			setMobileClick(false);
		}
	});

	useEffect(() => {
		processedInFrameRef.current = false;
	}, [mobileClick]);

	useEffect(() => {
		if (deviceMode !== 'keyboard') return;

		const handleDocumentClick = (e) => {
			if (e.button !== 0) return;
			if (checkProximityAndVisibility(camera)) {
				setCurtain(!isCurtainOpen);
			}
		};

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [
		checkProximityAndVisibility,
		setCurtain,
		isCurtainOpen,
		camera,
		deviceMode,
	]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (
				gamepadControls.action &&
				!wasActionPressedRef.current &&
				checkProximityAndVisibility(camera)
			) {
				wasActionPressedRef.current = true;
				setCurtain(!isCurtainOpen);
			} else if (!gamepadControls.action && wasActionPressedRef.current) {
				wasActionPressedRef.current = false;
			}
		};

		const interval = setInterval(checkGamepad, 16);
		return () => clearInterval(interval);
	}, [
		deviceMode,
		gamepadControlsRef,
		checkProximityAndVisibility,
		camera,
		setCurtain,
		isCurtainOpen,
	]);

	const easeInQuad = (t) => t * t;
	const time0Ref = useRef(0);
	const time1Ref = useRef(0);
	const lastCurtainStateRef = useRef(isCurtainOpen);

	useFrame((_, delta) => {
		if (lastCurtainStateRef.current !== isCurtainOpen) {
			time0Ref.current = 0;
			time1Ref.current = 0;
			lastCurtainStateRef.current = isCurtainOpen;
		}

		if (instantChangeRef.current) {
			mesh0Ref.current.position.x = isCurtainOpen
				? meshTargets.mesh0.open
				: meshTargets.mesh0.closed;
			mesh0Ref.current.scale.x = isCurtainOpen
				? meshScales.open
				: meshScales.closed;
			mesh1Ref.current.position.x = isCurtainOpen
				? meshTargets.mesh1.open
				: meshTargets.mesh1.closed;
			mesh1Ref.current.scale.x = isCurtainOpen
				? meshScales.open
				: meshScales.closed;
			return;
		}

		const animationSpeed = 2.5;
		time0Ref.current += delta * animationSpeed;
		if (time0Ref.current > 1) time0Ref.current = 1;
		const easedTime = easeInQuad(time0Ref.current);

		const targetX = isCurtainOpen
			? meshTargets.mesh0.open
			: meshTargets.mesh0.closed;
		const targetScaleX = isCurtainOpen ? meshScales.open : meshScales.closed;

		const currentX = mesh0Ref.current.position.x;
		const currentScaleX = mesh0Ref.current.scale.x;

		mesh0Ref.current.position.x = currentX + (targetX - currentX) * easedTime;
		mesh0Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime;

		time1Ref.current += delta * animationSpeed;
		if (time1Ref.current > 1) time1Ref.current = 1;
		const easedTime1 = easeInQuad(time1Ref.current);

		const targetX1 = isCurtainOpen
			? meshTargets.mesh1.open
			: meshTargets.mesh1.closed;

		const currentX1 = mesh1Ref.current.position.x;

		mesh1Ref.current.position.x =
			currentX1 + (targetX1 - currentX1) * easedTime1;
		mesh1Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime1;
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
					onPointerDown={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
					onPointerUp={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
					onClick={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
				/>
				<primitive
					position={primitivePositions.right}
					castShadow
					receiveShadow
					object={animationMeshCloneRight}
					onPointerDown={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
					onPointerUp={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
					onClick={(e) => {
						if (e.button !== 0) {
							e.stopPropagation();
						}
					}}
				/>
			</group>
			<PositionalAudio ref={curtainSoundRef} {...curtainSound} loop={false} />
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
