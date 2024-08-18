import { useRef, useMemo, useEffect, useCallback } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';

const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];

export default function RoomCurtain() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const group = useRef();
	const { nodes: rightNodes, animations: rightAnimations } = useGLTF(
		'/models/doors/roomCurtainRight.glb'
	);
	const { nodes: leftNodes, animations: leftAnimations } = useGLTF(
		'/models/doors/roomCurtainLeft.glb'
	);
	const mixerRightRef = useRef(new THREE.AnimationMixer(null));
	const mixerLeftRef = useRef(new THREE.AnimationMixer(null));
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const roomCurtains = useDoor((state) => state.roomCurtains);
	const setRoomCurtain = useDoor((state) => state.setRoomCurtain);
	const setRoomCurtains = useDoor((state) => state.setRoomCurtains);
	const { camera } = useThree();
	const curtainSoundRef = useRef();
	const roomNumberRef = useRef();
	const roomCurtainsRef = useRef();
	const mesh0Ref = useRef();
	const mesh1Ref = useRef();

	const animationMeshCloneLeft = useMemo(
		() => leftNodes.Grid004.clone(),
		[leftNodes]
	);
	const animationMeshCloneRight = useMemo(
		() => rightNodes.Grid005.clone(),
		[rightNodes]
	);

	const position = useMemo(() => {
		if (roomNumber >= roomTotal / 2)
			return [
				offset[0] -
					CORRIDORLENGTH -
					(roomNumber - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		else
			return [
				-(offset[0] - 5.91) - roomNumber * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];
	}, [roomNumber, roomTotal]);

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

	const openWindow = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.play();
		}, 500);

		setRoomCurtains(roomNumberRef.current, true);

		rightAnimations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = 4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 7 || action.time > 12) {
				action.reset();
				action.time = 6;
			}
			action.play();
		});

		leftAnimations.forEach((clip) => {
			const action = mixerSecond.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = 4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 7 || action.time > 12) {
				action.reset();
				action.time = 6;
			}
			action.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, rightAnimations, leftAnimations, setRoomCurtains]);

	const closeWindow = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.currentTime = 0;
			curtainSoundRef.current.play();
		}, 500);

		setRoomCurtains(roomNumberRef.current, false);

		rightAnimations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = -4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 7 || action.time > 12) {
				action.reset();
				action.time = 12.9;
			}
			action.play();
		});

		leftAnimations.forEach((clip) => {
			const action = mixerSecond.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = -4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 7 || action.time > 12) {
				action.reset();
				action.time = 12.9;
			}
			action.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, rightAnimations, leftAnimations, setRoomCurtains]);

	useEffect(() => {
		if (roomCurtain) {
			openWindow();
		} else {
			closeWindow();
		}
	}, [roomCurtain, openWindow, closeWindow]);

	useEffect(() => {
		if (roomCurtainsRef.current[roomNumber]) {
			setRoomCurtain(true);

			rightAnimations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = 4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 12;
				action.play();
			});

			leftAnimations.forEach((clip) => {
				const action = mixerSecond.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = 4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 12;
				action.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		} else {
			setRoomCurtain(false);

			rightAnimations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = -4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 7;
				action.play();
			});

			leftAnimations.forEach((clip) => {
				const action = mixerSecond.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = -4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 7;
				action.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		}
	}, [
		roomNumber,
		setRoomCurtain,
		rightAnimations,
		leftAnimations,
		mixer,
		mixerSecond,
	]);

	const checkProximity = useCallback(() => {
		return Math.abs(camera.position.z) > 9;
	}, [camera]);

	const handleClick = () => {
		if (checkProximity()) {
			setRoomCurtain(!roomCurtain);
		}
	};

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
				<primitive castShadow receiveShadow object={animationMeshCloneLeft} />
				<primitive castShadow receiveShadow object={animationMeshCloneRight} />
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
				<mesh
					ref={mesh0Ref}
					position={[3.45, 1.05, 5]}
					onPointerDown={() => handleClick()}
				>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="red" visible={false} />
				</mesh>
				<mesh
					ref={mesh1Ref}
					position={[4.6, 1.05, 5]}
					onPointerDown={() => handleClick()}
				>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="blue" visible={false} />
				</mesh>
			</group>
		</group>
	);
}

useGLTF.preload('/models/doors/roomCurtainRight.glb');
useGLTF.preload('/models/doors/roomCurtainLeft.glb');
