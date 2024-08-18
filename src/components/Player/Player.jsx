import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';

const WALK_SPEED = 2;
const RUN_SPEED = 4;
const CROUCH_SPEED = 1;
const JUMP_IMPULSE = 8;
const STEP_DISTANCE = 0.8;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

export default function Player() {
	const { scene, camera } = useThree();
	const [isJumping, setIsJumping] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isCrouching, setIsCrouching] = useState(false);
	const seedData = useGame((state) => state.seedData);
	const deaths = useGame((state) => state.deaths);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const monsterState = useMonster((state) => state.monsterState);
	const footstepIndexRef = useRef(0);
	const lastStepPosition = useRef(new THREE.Vector3());
	const ref = useRef();
	const spotLightRef = useRef();
	const { world } = useRapier();
	const [subscribeKeys, get] = useKeyboardControls();

	const footstepSounds = [
		useRef(new Audio('/sounds/step1.ogg')),
		useRef(new Audio('/sounds/step2.ogg')),
		useRef(new Audio('/sounds/step3.ogg')),
		useRef(new Audio('/sounds/step4.ogg')),
		useRef(new Audio('/sounds/step5.ogg')),
		useRef(new Audio('/sounds/step6.ogg')),
		useRef(new Audio('/sounds/step7.ogg')),
		useRef(new Audio('/sounds/step8.ogg')),
		useRef(new Audio('/sounds/step9.ogg')),
	];

	const bedSound = useRef(new Audio('/sounds/bed.ogg'));

	const hurtSounds = [
		useRef(new Audio('/sounds/hurt1.ogg')),
		useRef(new Audio('/sounds/hurt2.ogg')),
		useRef(new Audio('/sounds/hurt3.ogg')),
		useRef(new Audio('/sounds/hurt4.ogg')),
	];

	useEffect(() => {
		spotLightRef.current.angle = Math.PI / 6;
		spotLightRef.current.penumbra = 0.5;
	}, [camera]);

	const reset = useCallback(() => {
		ref.current.setTranslation({ x: 10.7, y: 1, z: -3 });
		ref.current.setLinvel({ x: 0, y: 0, z: 0 });
		ref.current.setAngvel({ x: 0, y: 0, z: 0 });

		camera.rotation.set(0, Math.PI, 0);
	}, [camera]);

	useEffect(() => {
		reset();
	}, [deaths, reset]);

	useEffect(() => {
		const unsubscribeReset = useGame.subscribe(
			(state) => state.phase,
			(value) => {
				if (value === 'ready') reset();
			}
		);
		const unsubscribeAny = subscribeKeys(() => {
			// start();
		});

		return () => {
			unsubscribeReset();
			unsubscribeAny();
		};
	}, [subscribeKeys, reset]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
				setIsRunning(true);
			}
			if (
				(event.code === 'ControlLeft' || event.code === 'ControlRight') &&
				monsterState !== 'run'
			) {
				setIsCrouching(true);
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
				setIsRunning(false);
			}
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				setIsCrouching(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [monsterState]);

	const isGrounded = () => {
		const ray = world.castRay(
			new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 })
		);
		return ray && ray.collider && Math.abs(ray.toi) <= 1.25;
	};

	useEffect(() => {
		const targetObject = new THREE.Object3D();
		scene.add(targetObject);
		spotLightRef.current.target = targetObject;

		return () => {
			scene.remove(targetObject);
		};
	}, [scene]);

	useFrame((state) => {
		if (!ref.current) return;

		const { forward, backward, left, right, jump } = get();

		frontVector.set(0, 0, Number(forward) - Number(backward));
		sideVector.set(Number(right) - Number(left), 0, 0);

		const cameraQuaternion = state.camera.quaternion.clone();
		const movementDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			cameraQuaternion
		);
		movementDirection.y = 0;
		movementDirection.normalize();

		const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
			cameraQuaternion
		);
		cameraRight.y = 0;
		cameraRight.normalize();

		direction.set(0, 0, 0);
		direction.addScaledVector(movementDirection, frontVector.z);
		direction.addScaledVector(cameraRight, sideVector.x);
		direction
			.normalize()
			.multiplyScalar(
				isRunning ? RUN_SPEED : isCrouching ? CROUCH_SPEED : WALK_SPEED
			);

		const position = ref.current.translation();
		state.camera.position.set(position.x, position.y, position.z);

		if (monsterState !== 'run') {
			ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);

			ref.current.setLinvel({
				x: direction.x,
				y: ref.current.linvel().y,
				z: direction.z,
			});

			if (!jump && isGrounded() && isJumping) {
				if (position.y > 1.7 && position.y < 1.8) {
					bedSound.current.volume = 0.8;
					bedSound.current.currentTime = 0;
					bedSound.current.play();

					if (seedData[playerPositionRoom]?.hurt) {
						const randomHurtSound =
							hurtSounds[Math.floor(Math.random() * hurtSounds.length)].current;
						randomHurtSound.volume = 0.8;
						randomHurtSound.currentTime = 0;
						randomHurtSound.play();
					}
				}
				setIsJumping(false);
			}
			if (jump && isGrounded() && !isJumping) {
				setIsJumping(true);
				ref.current.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
			}
		} else {
			ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);
		}

		const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
			state.camera.quaternion
		);
		const distance = 10;
		const backwardDistance = 0.7;

		const lightPosition = new THREE.Vector3(
			position.x - cameraDirection.x * backwardDistance,
			position.y + 0.25,
			position.z - cameraDirection.z * backwardDistance
		);

		spotLightRef.current.position.set(
			lightPosition.x,
			lightPosition.y,
			lightPosition.z
		);

		const targetPosition = new THREE.Vector3(
			position.x + cameraDirection.x * distance,
			position.y + cameraDirection.y * distance,
			position.z + cameraDirection.z * distance
		);
		spotLightRef.current.target.position.copy(targetPosition);

		if (isGrounded() && !isJumping) {
			const distanceTraveled = lastStepPosition.current.distanceTo(position);

			if (distanceTraveled > STEP_DISTANCE) {
				const sound = footstepSounds[footstepIndexRef.current].current;
				sound.volume = 0.8;
				sound.currentTime = 0;
				sound.play();

				footstepIndexRef.current =
					(footstepIndexRef.current + 1) % footstepSounds.length;

				lastStepPosition.current.copy(position);
			}
		}
	});

	return (
		<>
			<spotLight
				shadow-normalBias={0.04}
				intensity={12}
				castShadow
				ref={spotLightRef}
			/>
			<RigidBody
				ref={ref}
				restitution={0}
				colliders={false}
				mass={1}
				type="dynamic"
				position={[10.7, 2, -3]}
				enabledRotations={[false, false, false]}
				enabledTranslations={[true, true, true]}
			>
				<CapsuleCollider args={isCrouching ? [0.4, 0.4] : [0.8, 0.4]} />
			</RigidBody>
		</>
	);
}
