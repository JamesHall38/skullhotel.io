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
	const { nodes, animations } = useGLTF('/models/doors/bathroom_curtain.glb');
	const mixerRightRef = useRef(new THREE.AnimationMixer(null));
	const mixerLeftRef = useRef(new THREE.AnimationMixer(null));
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const bathroomCurtains = useDoor((state) => state.bathroomCurtains);
	const setBathroomCurtain = useDoor((state) => state.setBathroomCurtain);
	const setBathroomCurtains = useDoor((state) => state.setBathroomCurtains);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const curtainSoundRef = useRef();
	const bathroomCurtainsRef = useRef();
	const bathroomNumberRef = useRef();
	const { camera } = useThree();
	const mesh0Ref = useRef();
	const mesh1Ref = useRef();

	const animationMeshCloneLeft = useMemo(() => {
		const clone = nodes._.clone();
		clone.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
		return clone;
	}, [nodes]);

	const animationMeshCloneRight = useMemo(() => nodes._.clone(), [nodes]);

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

		animations.forEach((clip) => {
			const actionLeft = mixer.clipAction(clip);
			const actionRight = mixerSecond.clipAction(clip);

			actionLeft.clampWhenFinished = true;
			actionLeft.timeScale = 4;
			actionLeft.loop = THREE.LoopOnce;
			actionLeft.repetitions = 1;

			actionRight.clampWhenFinished = true;
			actionRight.timeScale = 4;
			actionRight.loop = THREE.LoopOnce;
			actionRight.repetitions = 1;

			if (actionLeft.time < 0.1 || actionLeft.time > 4) {
				actionLeft.reset();
				actionLeft.time = 0;
			}
			if (actionRight.time < 0.1 || actionRight.time > 4) {
				actionRight.reset();
				actionRight.time = 0;
			}
			actionLeft.play();
			actionRight.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, animations, setBathroomCurtains]);

	const closeWindow = useCallback(() => {
		curtainSoundRef.current.stop();
		curtainSoundRef.current.currentTime = 0;
		curtainSoundRef.current.play();

		setBathroomCurtains(bathroomNumberRef.current, false);

		animations.forEach((clip) => {
			const actionLeft = mixer.clipAction(clip);
			const actionRight = mixerSecond.clipAction(clip);

			actionLeft.clampWhenFinished = true;
			actionLeft.timeScale = -4;
			actionLeft.loop = THREE.LoopOnce;
			actionLeft.repetitions = 1;

			actionRight.clampWhenFinished = true;
			actionRight.timeScale = -4;
			actionRight.loop = THREE.LoopOnce;
			actionRight.repetitions = 1;

			if (actionLeft.time < 0.1 || actionLeft.time > 4) {
				actionLeft.reset();
				actionLeft.time = 4;
			}
			if (actionRight.time < 0.1 || actionRight.time > 4) {
				actionRight.reset();
				actionRight.time = 4;
			}
			actionLeft.play();
			actionRight.play();
		});

		mixerRightRef.current = mixer;
		mixerLeftRef.current = mixerSecond;
	}, [mixer, mixerSecond, animations, setBathroomCurtains]);

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
			animations.forEach((clip) => {
				const actionLeft = mixer.clipAction(clip);
				const actionRight = mixerSecond.clipAction(clip);

				actionLeft.clampWhenFinished = true;
				actionLeft.timeScale = 4;
				actionLeft.loop = THREE.LoopOnce;
				actionLeft.repetitions = 1;
				actionLeft.reset();
				actionLeft.time = 4;
				actionLeft.play();

				actionRight.clampWhenFinished = true;
				actionRight.timeScale = 4;
				actionRight.loop = THREE.LoopOnce;
				actionRight.repetitions = 1;
				actionRight.reset();
				actionRight.time = 4;
				actionRight.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		} else {
			setBathroomCurtain(false);
			animations.forEach((clip) => {
				const actionLeft = mixer.clipAction(clip);
				const actionRight = mixerSecond.clipAction(clip);

				actionLeft.clampWhenFinished = true;
				actionLeft.timeScale = -4;
				actionLeft.loop = THREE.LoopOnce;
				actionLeft.repetitions = 1;
				actionLeft.reset();
				actionLeft.time = 0;
				actionLeft.play();

				actionRight.clampWhenFinished = true;
				actionRight.timeScale = -4;
				actionRight.loop = THREE.LoopOnce;
				actionRight.repetitions = 1;
				actionRight.reset();
				actionRight.time = 0;
				actionRight.play();
			});

			mixerRightRef.current = mixer;
			mixerLeftRef.current = mixerSecond;
		}
	}, [roomNumber, setBathroomCurtain, animations, mixer, mixerSecond]);

	const checkProximity = useCallback(() => {
		const isInGoodXRange =
			Math.abs(camera.position.x) - Math.abs(position[0]) > -1;
		let isInGoodZRange = Math.abs(camera.position.z) < 3.8;
		if (camera.position.x > 2.2 && camera.position.x < 4) {
			isInGoodZRange = true;
		}
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
				<primitive
					position={[-1.36, 0, 0]}
					castShadow
					receiveShadow
					object={animationMeshCloneLeft}
				/>
				<primitive
					position={[0.02, 0, 0]}
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

useGLTF.preload('/models/doors/bathroom_curtain.glb');
