import { useRef, useMemo, useEffect, useCallback } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import useInterface from '../../hooks/useInterface';

const CORRIDORLENGTH = 5.95;
const offset = [8.9, 0, 6.1];

export default function RoomCurtain() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const group = useRef();
	const { nodes: rightNodes, animations } = useGLTF(
		'/models/doors/room_curtain.glb'
	);
	const mixerRightRef = useRef(new THREE.AnimationMixer(null));
	const mixerLeftRef = useRef(new THREE.AnimationMixer(null));
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const roomCurtains = useDoor((state) => state.roomCurtains);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const setRoomCurtains = useDoor((state) => state.setRoomCurtains);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const setCursor = useInterface((state) => state.setCursor);
	const cursor = useInterface((state) => state.cursor);
	const {
		camera,
		// , scene
	} = useThree();
	const curtainSoundRef = useRef();
	const roomNumberRef = useRef();
	const roomCurtainsRef = useRef();
	const mesh0Ref = useRef();
	const mesh1Ref = useRef();
	const prevDetectedRef = useRef(false);
	const cursorStateRef = useRef(null);
	const isInitial = useRef(true);

	const animationMeshCloneLeft = useMemo(() => {
		const clone = rightNodes.Grid005.clone();
		clone.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
		return clone;
	}, [rightNodes]);

	const animationMeshCloneRight = useMemo(
		() => rightNodes.Grid005.clone(),
		[rightNodes]
	);

	const position = useMemo(() => {
		let calculatedPosition;

		if (playerPositionRoom >= roomTotal / 2) {
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(playerPositionRoom - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		} else {
			calculatedPosition = [
				-(offset[0] - 5.91) - playerPositionRoom * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
		}

		if (camera.position.x > 8) {
			calculatedPosition = [14.5, 0, 14.5];
		} else if (camera.position.x <= 8 && camera.position.x > 4.4) {
			calculatedPosition = [3.02, 0, 7.9];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

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
		roomCurtainsRef.current = roomCurtains;
	}, [roomCurtains]);

	const openCurtain = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.play();
		}, 500);

		setRoomCurtains(roomNumberRef.current, true);

		animations.forEach((clip) => {
			const actionRight = mixer.clipAction(clip);
			const actionLeft = mixerSecond.clipAction(clip);

			actionRight.clampWhenFinished = true;
			actionRight.timeScale = 4;
			actionRight.loop = THREE.LoopOnce;
			actionRight.repetitions = 1;

			actionLeft.clampWhenFinished = true;
			actionLeft.timeScale = 4;
			actionLeft.loop = THREE.LoopOnce;
			actionLeft.repetitions = 1;

			if (actionRight.time < 7 || actionRight.time > 12) {
				actionRight.reset();
				actionRight.time = 6;
			}
			if (actionLeft.time < 7 || actionLeft.time > 12) {
				actionLeft.reset();
				actionLeft.time = 6;
			}
			actionRight.play();
			actionLeft.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, animations, setRoomCurtains]);

	const closeCurtain = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.currentTime = 0;
			curtainSoundRef.current.play();
		}, 500);

		setRoomCurtains(roomNumberRef.current, false);

		animations.forEach((clip) => {
			const actionRight = mixer.clipAction(clip);
			const actionLeft = mixerSecond.clipAction(clip);

			actionRight.clampWhenFinished = true;
			actionRight.timeScale = -4;
			actionRight.loop = THREE.LoopOnce;
			actionRight.repetitions = 1;

			actionLeft.clampWhenFinished = true;
			actionLeft.timeScale = -4;
			actionLeft.loop = THREE.LoopOnce;
			actionLeft.repetitions = 1;

			if (actionRight.time < 7 || actionRight.time > 12) {
				actionRight.reset();
				actionRight.time = 12.9;
			}
			if (actionLeft.time < 7 || actionLeft.time > 12) {
				actionLeft.reset();
				actionLeft.time = 12.9;
			}
			actionRight.play();
			actionLeft.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, animations, setRoomCurtains]);

	useEffect(() => {
		if (roomCurtain && Math.abs(camera.position.z) > 0.4) {
			openCurtain();
		} else if (!roomCurtain && Math.abs(camera.position.z) > 0.4) {
			if (isInitial.current) {
				isInitial.current = false;
			} else {
				closeCurtain();
			}
		}
	}, [roomCurtain, openCurtain, closeCurtain, camera]);

	useEffect(() => {
		if (roomCurtainsRef.current[roomNumber]) {
			setRoomCurtain(true);

			animations.forEach((clip) => {
				const actionRight = mixer.clipAction(clip);
				const actionLeft = mixerSecond.clipAction(clip);

				actionRight.clampWhenFinished = true;
				actionRight.timeScale = 4;
				actionRight.loop = THREE.LoopOnce;
				actionRight.repetitions = 1;
				actionRight.reset();
				actionRight.time = 12;
				actionRight.play();

				actionLeft.clampWhenFinished = true;
				actionLeft.timeScale = 4;
				actionLeft.loop = THREE.LoopOnce;
				actionLeft.repetitions = 1;
				actionLeft.reset();
				actionLeft.time = 12;
				actionLeft.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		} else {
			setRoomCurtain(false);

			animations.forEach((clip) => {
				const actionRight = mixer.clipAction(clip);
				const actionLeft = mixerSecond.clipAction(clip);

				actionRight.clampWhenFinished = true;
				actionRight.timeScale = -4;
				actionRight.loop = THREE.LoopOnce;
				actionRight.repetitions = 1;
				actionRight.reset();
				actionRight.time = 7;
				actionRight.play();

				actionLeft.clampWhenFinished = true;
				actionLeft.timeScale = -4;
				actionLeft.loop = THREE.LoopOnce;
				actionLeft.repetitions = 1;
				actionLeft.reset();
				actionLeft.time = 7;
				actionLeft.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		}
	}, [roomNumber, setRoomCurtain, animations, mixer, mixerSecond]);

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
	}, [
		camera,
		// , scene
	]);

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
				setRoomCurtain(!roomCurtain);
			}
		};

		document.addEventListener('click', handleDocumentClick);
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	}, [checkProximityAndVisibility, setRoomCurtain, roomCurtain, camera]);

	const easeInQuad = (t) => t * t;
	let time0 = 0;
	let time1 = 0;

	useFrame(() => {
		time0 += 0.002;
		if (time0 > 1) time0 = 1;
		const easedTime = easeInQuad(time0);

		const targetX = roomCurtain ? 2.4 : 1.95;
		const targetScaleX = roomCurtain ? 0.6 : 1.1;

		const currentX = mesh0Ref.current.position.x;
		const currentScaleX = mesh0Ref.current.scale.x;

		mesh0Ref.current.position.x = currentX + (targetX - currentX) * easedTime;
		mesh0Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime;
	});

	useFrame(() => {
		time1 += 0.002;
		if (time1 > 1) time1 = 1;
		const easedTime = easeInQuad(time1);

		const targetX = roomCurtain ? 0.35 : 0.625;
		const targetScaleX = roomCurtain ? 0.6 : 1.1;

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
		<group
			ref={group}
			position={position}
			rotation={[0, position[2] < 0 ? Math.PI : 0, 0]}
			dispose={null}
		>
			<group name="Scene">
				<primitive
					position={[2.67, 0, 0.05]}
					castShadow
					receiveShadow
					object={animationMeshCloneLeft}
				/>
				<primitive
					position={[-0.6, 0, 0.22]}
					rotation={[0, 0.15, 0]}
					castShadow
					receiveShadow
					object={animationMeshCloneRight}
				/>
			</group>
			<PositionalAudio
				ref={curtainSoundRef}
				url="/sounds/curtain.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.25}
			/>
			<group>
				<mesh ref={mesh0Ref} position={[3.45, 1.05, 5]}>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="red" visible={false} />
				</mesh>
				<mesh ref={mesh1Ref} position={[4.6, 1.05, 5]}>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="blue" visible={false} />
				</mesh>
			</group>
		</group>
	);
}

useGLTF.preload('/models/doors/room_curtain.glb');
