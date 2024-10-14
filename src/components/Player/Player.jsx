import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import useGame from '../../hooks/useGame';
import useMonster from '../../hooks/useMonster';
import useGamepadControls from '../../hooks/useGamepadControls';
import useJoysticksStore from '../../hooks/useJoysticks';
import Flashlight from './Flashlight';

const WALK_SPEED = 2;
const RUN_SPEED = 4;
const CROUCH_SPEED = 1;
const JUMP_IMPULSE = 8;
const CROUCH_JUMP_IMPULSE = 0.01;
const STEP_DISTANCE = 0.8;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const floor = 0.26;

export default function Player() {
	const isMobile = useGame((state) => state.isMobile);
	const { camera } = useThree();
	const [isJumping, setIsJumping] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isCrouching, setIsCrouching] = useState(false);
	const [canStandUp, setCanStandUp] = useState(true);
	const [wantsToStandUp, setWantsToStandUp] = useState(false);
	const seedData = useGame((state) => state.seedData);
	const deaths = useGame((state) => state.deaths);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deviceMode = useGame((state) => state.deviceMode);
	const loading = useGame((state) => state.loading);
	const monsterState = useMonster((state) => state.monsterState);
	const footstepIndexRef = useRef(0);
	const lastStepPosition = useRef(new THREE.Vector3());
	const ref = useRef();
	const { world } = useRapier();
	const isLocked = useGame((state) => state.isLocked);
	const [subscribeKeys, getKeys] = useKeyboardControls();
	const getGamepadControls = useGamepadControls();
	const yaw = useRef(Math.PI);
	const pitch = useRef(0);

	const leftStickRef = useRef({ x: 0, y: 0 });
	const rightStickRef = useRef({ x: 0, y: 0 });

	useJoysticksStore.setState({
		leftStickRef,
		rightStickRef,
	});

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

	const reset = useCallback(() => {
		if (isMobile) {
			ref.current.setTranslation({ x: 0, y: 1, z: 0 });
		} else {
			ref.current.setTranslation({ x: 10.7, y: 1, z: -3 });
		}
		ref.current.setLinvel({ x: 0, y: 0, z: 0 });
		ref.current.setAngvel({ x: 0, y: 0, z: 0 });

		camera.rotation.set(0, Math.PI, 0);
		yaw.current = Math.PI / 2;
		pitch.current = 0;
	}, [camera, isMobile]);

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
				setWantsToStandUp(false);
			}
			if (event.ctrlKey) {
				event.preventDefault();
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
				setIsRunning(false);
			}
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				if (canStandUp) {
					setIsCrouching(false);
					setForcedCrouch(false);
				} else {
					setWantsToStandUp(true);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [monsterState, canStandUp]);

	const isGrounded = () => {
		const ray = world.castRay(
			new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 })
		);
		return ray && ray.collider && Math.abs(ray.toi) <= 1.25;
	};

	const checkHeadSpace = useCallback(() => {
		if (!ref.current) return false;
		const position = ref.current.translation();
		const rayDirections = [
			{ x: 0, y: 1, z: 0 },
			{ x: 0.3, y: 1, z: 0 },
			{ x: -0.3, y: 1, z: 0 },
			{ x: 0, y: 1, z: 0.3 },
			{ x: 0, y: 1, z: -0.3 },
		];

		for (const direction of rayDirections) {
			const ray = world.castRay(
				new RAPIER.Ray(
					{
						x: position.x + direction.x,
						y: position.y + 0.2,
						z: position.z + direction.z,
					},
					{ x: 0, y: 1, z: 0 }
				)
			);
			if (ray && ray.toi <= 1.8) {
				return false;
			}
		}
		return true;
	}, [world]);

	const [forcedCrouch, setForcedCrouch] = useState(false);
	const forcedCrouchTimer = useRef(null);

	useFrame(() => {
		if (ref.current) {
			const hasHeadSpace = checkHeadSpace();

			if (!hasHeadSpace && isCrouching) {
				setForcedCrouch(true);
				if (forcedCrouchTimer.current) {
					clearTimeout(forcedCrouchTimer.current);
				}
			} else if (hasHeadSpace && forcedCrouch) {
				if (!forcedCrouchTimer.current) {
					forcedCrouchTimer.current = setTimeout(() => {
						setForcedCrouch(false);
						forcedCrouchTimer.current = null;
					}, 500);
				}
			}

			if (forcedCrouch) {
				const currentPosition = ref.current.translation();
				ref.current.setTranslation({
					x: currentPosition.x,
					y: floor,
					z: currentPosition.z,
				});
			}
		}
	});

	useFrame(
		(state) => {
			if (!ref.current || !isLocked) return;

			const {
				forward: keyForward,
				backward: keyBackward,
				left: keyLeft,
				right: keyRight,
				jump: keyJump,
			} = getKeys();
			const gamepadControls = getGamepadControls();

			const leftStick = leftStickRef.current;
			const rightStick = rightStickRef.current;

			let forward = keyForward || gamepadControls.forward;
			let backward = keyBackward || gamepadControls.backward;
			let left = keyLeft || gamepadControls.left;
			let right = keyRight || gamepadControls.right;

			if (Math.abs(leftStick.y) > 0.1) {
				forward = leftStick.y < 0;
				backward = leftStick.y > 0;
			}

			if (Math.abs(leftStick.x) > 0.1) {
				left = leftStick.x < 0;
				right = leftStick.x > 0;
			}

			let jump = keyJump || gamepadControls.jump;

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
			state.camera.position.set(position.x, position.y + 0.2, position.z);

			if (monsterState !== 'run') {
				ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);

				ref.current.setLinvel({
					x: direction.x,
					y: ref.current.linvel().y,
					z: direction.z,
				});

				if (!jump && isGrounded() && isJumping && !loading) {
					if (position.y > 1.7 && position.y < 1.8) {
						bedSound.current.volume = 0.8;
						bedSound.current.currentTime = 0;
						bedSound.current.play();

						if (seedData[playerPositionRoom]?.hurt) {
							const randomHurtSound =
								hurtSounds[Math.floor(Math.random() * hurtSounds.length)]
									.current;
							randomHurtSound.volume = 0.8;
							randomHurtSound.currentTime = 0;
							randomHurtSound.play();
						}
					}
					setIsJumping(false);
				}
				if (jump && isGrounded() && !isJumping) {
					setIsJumping(true);
					const jumpForce = isCrouching ? CROUCH_JUMP_IMPULSE : JUMP_IMPULSE;
					ref.current.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
				}

				if (isCrouching) {
					const currentPosition = ref.current.translation();
					ref.current.setTranslation({
						x: currentPosition.x,
						y: floor,
						z: currentPosition.z,
					});
				}

				const hasHeadSpace = checkHeadSpace();
				setCanStandUp(hasHeadSpace);

				if (isCrouching && hasHeadSpace && wantsToStandUp) {
					setIsCrouching(false);
					setWantsToStandUp(false);
				}
			} else {
				ref.current.setLinvel({ x: 0, y: ref.current.linvel().y, z: 0 }, true);
			}

			if (isGrounded() && !isJumping && !loading) {
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

			if ((deviceMode === 'gamepad' || isMobile) && monsterState !== 'run') {
				const rotationSpeed = 0.03;

				if (Math.abs(rightStick.x) > 0.1) {
					yaw.current -= rightStick.x * rotationSpeed;
				}

				if (Math.abs(rightStick.y) > 0.1) {
					pitch.current -= rightStick.y * rotationSpeed;
				}

				const maxPitch = Math.PI / 2 - 0.01;
				const minPitch = -Math.PI / 2 + 0.01;
				pitch.current = Math.max(minPitch, Math.min(maxPitch, pitch.current));

				state.camera.rotation.order = 'YXZ';
				state.camera.rotation.y = yaw.current;
				state.camera.rotation.x = pitch.current;
				state.camera.rotation.z = 0;
			}

			return () => {
				if (forcedCrouchTimer.current) {
					clearTimeout(forcedCrouchTimer.current);
				}
			};
		},
		[
			getKeys,
			getGamepadControls,
			monsterState,
			isCrouching,
			isJumping,
			deviceMode,
			isMobile,
		]
	);

	return (
		<>
			<Flashlight playerRef={ref} />
			<RigidBody
				ref={ref}
				restitution={0}
				colliders={false}
				type="dynamic"
				position={!isMobile ? [10.7, 2, -3] : [0, 0, 0]}
				enabledRotations={[false, false, false]}
				enabledTranslations={[true, true, true]}
				linearDamping={isCrouching ? 10 : 0.5}
				angularDamping={isCrouching ? 10 : 0.5}
			>
				<CapsuleCollider args={isCrouching ? [0.13, 0.13] : [0.8, 0.4]} />
			</RigidBody>
		</>
	);
}
