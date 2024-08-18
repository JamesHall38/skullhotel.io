import { useRef, useMemo, useEffect, useCallback } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';

const CORRIDORLENGTH = 5.95;
const offset = [8.84, 0, 6.2];

export default function BathbathroomCurtain({ positionOffset }) {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const group = useRef();
	const { nodes: leftNodes, animations: leftAnimations } = useGLTF(
		'/models/doors/bathroomCurtainLeft.glb'
	);
	const { nodes: rightNodes, animations: rightAnimations } = useGLTF(
		'/models/doors/bathroomCurtainRight.glb'
	);
	const mixerRightRef = useRef(new THREE.AnimationMixer(null));
	const mixerLeftRef = useRef(new THREE.AnimationMixer(null));
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const bathroomCurtains = useDoor((state) => state.bathroomCurtains);
	const setBathroomCurtain = useDoor((state) => state.setBathroomCurtain);
	const setBathroomCurtains = useDoor((state) => state.setBathroomCurtains);
	const curtainSoundRef = useRef();
	const bathroomCurtainsRef = useRef();
	const bathroomNumberRef = useRef();
	const { camera } = useThree();
	const mesh0Ref = useRef();
	const mesh1Ref = useRef();

	const animationMeshCloneLeft = useMemo(
		() => leftNodes._.clone(),
		[leftNodes]
	);
	const animationMeshCloneRight = useMemo(
		() => rightNodes.Grid004.clone(),
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
		() => new THREE.AnimationMixer(animationMeshCloneLeft),
		[animationMeshCloneLeft]
	);
	const mixerSecond = useMemo(
		() => new THREE.AnimationMixer(animationMeshCloneRight),
		[animationMeshCloneRight]
	);

	useEffect(() => {
		bathroomNumberRef.current = roomNumber;
	}, [roomNumber]);

	useEffect(() => {
		bathroomCurtainsRef.current = bathroomCurtains;
	}, [bathroomCurtains]);

	const openWindow = useCallback(() => {
		setTimeout(() => {
			curtainSoundRef.current.stop();
			curtainSoundRef.current.currentTime = 0;
			curtainSoundRef.current.play();
		}, 400);

		setBathroomCurtains(bathroomNumberRef.current, true);

		leftAnimations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = 4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 0.1 || action.time > 4) {
				action.reset();
				action.time = 0;
			}
			action.play();
		});

		rightAnimations.forEach((clip) => {
			const action = mixerSecond.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = 4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 0.1 || action.time > 4) {
				action.reset();
				action.time = 0;
			}
			action.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [
		mixer,
		mixerSecond,
		leftAnimations,
		rightAnimations,
		setBathroomCurtains,
	]);

	const closeWindow = useCallback(() => {
		curtainSoundRef.current.stop();
		curtainSoundRef.current.currentTime = 0;
		curtainSoundRef.current.play();

		setBathroomCurtains(bathroomNumberRef.current, false);

		leftAnimations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = -4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 0.1 || action.time > 4) {
				action.reset();
				action.time = 4;
			}
			action.play();
		});

		rightAnimations.forEach((clip) => {
			const action = mixerSecond.clipAction(clip);
			action.clampWhenFinished = true;
			action.timeScale = -4;
			action.loop = THREE.LoopOnce;
			action.repetitions = 1;

			if (action.time < 0.1 || action.time > 4) {
				action.reset();
				action.time = 4;
			}
			action.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [
		mixer,
		mixerSecond,
		leftAnimations,
		rightAnimations,
		setBathroomCurtains,
	]);

	useEffect(() => {
		if (bathroomCurtain) {
			openWindow();
		} else {
			closeWindow();
		}
	}, [bathroomCurtain, openWindow, closeWindow]);

	useEffect(() => {
		if (bathroomCurtainsRef.current[roomNumber]) {
			setBathroomCurtain(true);
			leftAnimations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = 4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 4;
				action.play();
			});

			rightAnimations.forEach((clip) => {
				const action = mixerSecond.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = 4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 4;
				action.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		} else {
			setBathroomCurtain(false);
			leftAnimations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = -4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 0;
				action.play();
			});

			rightAnimations.forEach((clip) => {
				const action = mixerSecond.clipAction(clip);
				action.clampWhenFinished = true;
				action.timeScale = -4;
				action.loop = THREE.LoopOnce;
				action.repetitions = 1;
				action.reset();
				action.time = 0;
				action.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		}
	}, [
		roomNumber,
		setBathroomCurtain,
		leftAnimations,
		rightAnimations,
		mixer,
		mixerSecond,
	]);

	const checkProximity = useCallback(() => {
		const isInGoodXRange =
			Math.abs(camera.position.x) - Math.abs(position[0]) > -1;
		const isInGoodZRange = Math.abs(camera.position.z) < 3.8;
		return isInGoodXRange && isInGoodZRange;
	}, [camera, position]);

	const handleClick = () => {
		if (checkProximity()) {
			setBathroomCurtain(!bathroomCurtain);
		}
	};

	const easeInQuad = (t) => t * t;
	let time0 = 0;
	let time1 = 0;

	useFrame(() => {
		time0 += 0.002;
		if (time0 > 1) time0 = 1;
		const easedTime = easeInQuad(time0);

		const targetX = bathroomCurtain ? -1.3 : -1.15;
		const targetScaleX = bathroomCurtain ? 0.4 : 0.8;

		const currentX = mesh0Ref.current?.position.x;
		const currentScaleX = mesh0Ref.current?.scale.x;

		if (!currentX || !currentScaleX) return;
		mesh0Ref.current.position.x = currentX + (targetX - currentX) * easedTime;
		mesh0Ref.current.scale.x =
			currentScaleX + (targetScaleX - currentScaleX) * easedTime;
	});

	useFrame(() => {
		time1 += 0.002;
		if (time1 > 1) time1 = 1;
		const easedTime = easeInQuad(time1);

		const targetX = bathroomCurtain ? 0.1 : -0.2;
		const targetScaleX = bathroomCurtain ? 0.4 : 0.8;

		const currentX = mesh1Ref.current?.position.x;
		const currentScaleX = mesh1Ref.current?.scale.x;

		if (!currentX || !currentScaleX) return;
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
			position={[
				position[0] +
					((positionOffset
						? roomNumber >= roomTotal / 2
							? 2
							: positionOffset
						: 0) || 0),
				position[1],
				position[2],
			]}
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
					position={[-2.55, 1.45, -3.8]}
					onPointerDown={() => handleClick(new THREE.Vector3())}
				>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="red" visible={false} />
				</mesh>
				<mesh
					ref={mesh1Ref}
					position={[-0.4, 1.45, -3.8]}
					onPointerDown={() => handleClick()}
				>
					<boxGeometry args={[1.2, 1.8, 0.2]} />
					<meshBasicMaterial color="blue" visible={false} />
				</mesh>
			</group>
		</group>
	);
}

useGLTF.preload('/models/doors/bathroomCurtainLeft.glb');
useGLTF.preload('/models/doors/bathroomCurtainRight.glb');
