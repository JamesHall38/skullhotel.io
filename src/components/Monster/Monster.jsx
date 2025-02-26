import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Animations from './Animations';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import { findPath } from './pathfinding';
import useDoor from '../../hooks/useDoor';
import useHiding from '../../hooks/useHiding';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import useGameplaySettings from '../../hooks/useGameplaySettings';

const BASE_SPEED = 5;
const CHASE_SPEED = 0.5;
const NEXT_POINT_THRESHOLD = 0.5;
const MIN_DISTANCE_FOR_RECALCULATION = 2;
const ATTACK_DISTANCE = 0.8;
const IDEAL_ATTACK_DISTANCE = 0.8;
const ATTACK_POSITION_LERP_SPEED = 0.15;

function lerpCameraLookAt(camera, targetPosition, lerpFactor) {
	const targetQuaternion = new THREE.Quaternion();
	const cameraDirection = new THREE.Vector3();

	cameraDirection.subVectors(targetPosition, camera.position);
	cameraDirection.y = 0;
	cameraDirection.normalize();

	targetQuaternion.setFromUnitVectors(
		new THREE.Vector3(0, 0, -1),
		cameraDirection
	);

	camera.quaternion.slerp(targetQuaternion, lerpFactor);
}

const Monster = (props) => {
	const group = useRef();
	const jumpScareSoundRef = useRef(null);
	const [hasPlayedJumpScare, setHasPlayedJumpScare] = useState(false);
	const [soundsReady, setSoundsReady] = useState(false);
	const { gl } = useThree();
	const { nodes, materials, animations } = useGLTF(
		'/models/monster-opt.glb',
		undefined,
		undefined,
		(loader) => {
			const ktxLoader = new KTX2Loader();
			ktxLoader.setTranscoderPath(
				'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets/basis/'
			);
			ktxLoader.detectSupport(gl);
			loader.setKTX2Loader(ktxLoader);
		}
	);

	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const monsterState = useMonster((state) => state.monsterState);
	const setMonsterState = useMonster((state) => state.setMonsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const setMonsterPosition = useMonster((state) => state.setMonsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const animationName = useMonster((state) => state.animationName);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const setAnimationMixSpeed = useMonster(
		(state) => state.setAnimationMixSpeed
	);
	const setJumpScare = useGame((state) => state.setJumpScare);
	const jumpScare = useGame((state) => state.jumpScare);
	const deaths = useGame((state) => state.deaths);

	const roomDoors = useDoor((state) => state.roomDoor);
	const nightstandDoor = useDoor((state) => state.nightStand);
	const deskDoor = useDoor((state) => state.desk);
	const roomCurtain = useDoor((state) => state.roomCurtain);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);

	const setRoomDoor = useDoor((state) => state.setRoomDoor);
	const setBathroomDoors = useDoor((state) => state.setBathroomDoors);
	const [currentPath, setCurrentPath] = useState(null);
	const [pathfindingFailures, setPathfindingFailures] = useState(0);
	const MAX_PATHFINDING_FAILURES = 3;
	const headBoneRef = useRef();
	const lastTargetRef = useRef({ x: 0, z: 0 });
	const [isWaiting, setIsWaiting] = useState(false);
	const timeoutRef = useRef(null);

	const monsterParts = useMemo(
		() => [
			{ name: 'skeleton', label: 'Base structure' },
			{ name: 'legs', label: 'Lower body' },
			{ name: 'body', label: 'Main body' },
			{ name: 'arms', label: 'Upper limbs' },
			{ name: 'head', label: 'Head' },
			{ name: 'details', label: 'Final details' },
		],
		[]
	);

	const { loadedItems, isLoading } = useProgressiveLoad(
		monsterParts,
		'Monster'
	);

	const visibleParts = useMemo(() => {
		return monsterParts.reduce((acc, part) => {
			acc[part.name] = loadedItems.some((item) => item.name === part.name);
			return acc;
		}, {});
	}, [loadedItems, monsterParts]);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				const sound = getAudioInstance('jumpScare');
				if (sound) {
					jumpScareSoundRef.current = sound;
					jumpScareSoundRef.current.volume = 1;
					jumpScareSoundRef.current.loop = false;
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (jumpScareSoundRef.current) {
				jumpScareSoundRef.current.pause();
				jumpScareSoundRef.current.currentTime = 0;
			}
		};
	}, []);

	useEffect(() => {
		setHasPlayedJumpScare(false);
	}, [deaths]);

	useEffect(() => {
		if (group.current && headBoneRef.current) {
			headBoneRef.current.rotation.set(0, 0, 0);
			group.current.rotation.set(0, Math.PI, 0);
			group.current.position.set(0, 10, 0);
			const monster = useMonster.getState();
			monster.setMonsterState('idle');
			monster.setMonsterPosition([0, 10, 0]);
			monster.setMonsterRotation([0, Math.PI, 0]);
		}
	}, [deaths]);

	const lookAtCamera = useCallback((camera) => {
		const targetPosition = new THREE.Vector3(
			camera.position.x,
			0,
			camera.position.z
		);
		group.current.lookAt(
			targetPosition.x,
			group.current.position.y,
			targetPosition.z
		);
	}, []);

	const runAtCamera = useCallback(
		(camera, delta, mode = 'run') => {
			const speed = mode === 'chase' ? CHASE_SPEED : BASE_SPEED;
			const targetPosition = new THREE.Vector3(
				camera.position.x,
				group.current.position.y,
				camera.position.z
			);

			const isMonsterNearHallway = Math.abs(group.current.position.z) < 6.5;
			const isInHallway = camera.position.z < 2;
			const currentRoomDoorState = roomDoors[playerPositionRoom];
			const isDoorOpen = currentRoomDoorState;
			const isRunningRoom =
				Object.keys(seedData)[playerPositionRoom] === 'runningWindowToDoor' ||
				Object.keys(seedData)[playerPositionRoom] ===
					'runningWindowCurtainToBed';

			if (
				mode === 'chase' &&
				isMonsterNearHallway &&
				isInHallway &&
				isDoorOpen &&
				isRunningRoom
			) {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');
				return;
			}

			const distanceToCamera =
				group.current.position.distanceTo(targetPosition);

			if (distanceToCamera <= ATTACK_DISTANCE) {
				if (!jumpScare) {
					setJumpScare(true);
				}
				playAnimation('Attack');
				setAnimationSpeed(1);

				if (!hasPlayedJumpScare && soundsReady && jumpScareSoundRef.current) {
					jumpScareSoundRef.current.currentTime = 0;
					jumpScareSoundRef.current.play().catch(() => {});
					setHasPlayedJumpScare(true);
				}

				const direction = new THREE.Vector3();
				direction
					.subVectors(group.current.position, targetPosition)
					.normalize();

				const idealPosition = new THREE.Vector3();
				const directionToIdeal = direction.clone();
				idealPosition
					.copy(targetPosition)
					.add(directionToIdeal.multiplyScalar(IDEAL_ATTACK_DISTANCE));

				group.current.position.lerp(idealPosition, ATTACK_POSITION_LERP_SPEED);
				group.current.position.y = 0;

				const targetLookAtPosition = new THREE.Vector3(
					group.current.position.x,
					group.current.position.y + 1.42,
					group.current.position.z
				);

				const lerpFactor = 0.1;
				lerpCameraLookAt(camera, targetLookAtPosition, lerpFactor);

				group.current.lookAt(
					targetPosition.x,
					group.current.position.y,
					targetPosition.z
				);
			} else {
				if (jumpScare) {
					setJumpScare(false);
				}

				if (monsterState !== 'chase') {
					if (animationName !== 'Run') {
						playAnimation('Run');
					}
				} else {
					if (animationName !== 'Walk') {
						playAnimation('Walk');
					}
				}

				if (mode === 'run') {
					const offsetX = 600;
					const offsetZ = 150;

					const monsterX = group.current.position.x * 10 + offsetX;
					const monsterZ = group.current.position.z * 10 + offsetZ;
					const targetX = camera.position.x * 10 + offsetX;
					const targetZ = camera.position.z * 10 + offsetZ;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

					if (!currentPath || distanceMoved > MIN_DISTANCE_FOR_RECALCULATION) {
						const newPath = findPath(monsterX, monsterZ, targetX, targetZ);
						if (newPath) {
							setCurrentPath(newPath);
							lastTargetRef.current = { x: targetX, z: targetZ };
							setPathfindingFailures(0);
						} else {
							setPathfindingFailures((prevFailures) => prevFailures + 1);
							if (pathfindingFailures >= MAX_PATHFINDING_FAILURES) {
								console.warn('Too many pathfinding failures, aborting');
								setCurrentPath(null);
								setPathfindingFailures(0);
							}
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							(nextPoint.x - offsetX) / 10 - group.current.position.x,
							0,
							(nextPoint.z - offsetZ) / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(
								(nextPoint.x - offsetX) / 10 - group.current.position.x,
								2
							) +
								Math.pow(
									(nextPoint.z - offsetZ) / 10 - group.current.position.z,
									2
								)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							setCurrentPath(currentPath.slice(1));
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				} else {
					const offsetX = 600;
					const offsetZ = 150;

					const monsterX = group.current.position.x * 10 + offsetX;
					const monsterZ = group.current.position.z * 10 + offsetZ;
					const targetX = camera.position.x * 10 + offsetX;
					const targetZ = camera.position.z * 10 + offsetZ;

					const distanceMoved = Math.sqrt(
						Math.pow(lastTargetRef.current.x - targetX, 2) +
							Math.pow(lastTargetRef.current.z - targetZ, 2)
					);

					if (!currentPath || distanceMoved > MIN_DISTANCE_FOR_RECALCULATION) {
						const newPath = findPath(monsterX, monsterZ, targetX, targetZ);
						if (newPath) {
							setCurrentPath(newPath);
							lastTargetRef.current = { x: targetX, z: targetZ };
							setPathfindingFailures(0);
						} else {
							setPathfindingFailures((prevFailures) => prevFailures + 1);
							if (pathfindingFailures >= MAX_PATHFINDING_FAILURES) {
								console.warn('Too many pathfinding failures, aborting');
								setCurrentPath(null);
								setPathfindingFailures(0);
							}
						}
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							(nextPoint.x - offsetX) / 10 - group.current.position.x,
							0,
							(nextPoint.z - offsetZ) / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						lookAtCamera(camera);

						const distanceToNextPoint = Math.sqrt(
							Math.pow(
								(nextPoint.x - offsetX) / 10 - group.current.position.x,
								2
							) +
								Math.pow(
									(nextPoint.z - offsetZ) / 10 - group.current.position.z,
									2
								)
						);

						if (distanceToNextPoint < NEXT_POINT_THRESHOLD) {
							setCurrentPath(currentPath.slice(1));
						}
					} else {
						const direction = new THREE.Vector3(
							camera.position.x - group.current.position.x,
							0,
							camera.position.z - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;
						const movement = direction.clone().multiplyScalar(moveSpeed);
						group.current.position.add(movement);

						group.current.lookAt(
							camera.position.x,
							group.current.position.y,
							camera.position.z
						);
					}
				}
			}
		},
		[
			playAnimation,
			jumpScare,
			currentPath,
			setAnimationSpeed,
			monsterState,
			lookAtCamera,
			pathfindingFailures,
			setJumpScare,
			hasPlayedJumpScare,
			soundsReady,
			animationName,
			roomDoors,
			playerPositionRoom,
			seedData,
			setMonsterState,
			setShakeIntensity,
		]
	);

	useEffect(() => {
		if (!nodes || !nodes.mixamorigHips) return;

		nodes.mixamorigHips.traverse((bone) => {
			if (bone.name === 'mixamorigHead') {
				headBoneRef.current = bone;
			}
		});
	}, [nodes, isLoading, visibleParts]);

	useFrame(({ camera }) => {
		if (
			!headBoneRef.current ||
			monsterState === 'run' ||
			monsterState === 'chase' ||
			monsterState === 'leaving' ||
			monsterState === 'facingCamera'
		)
			return;

		const headOffset =
			Object.values(seedData)[playerPositionRoom]?.headOffset || 0;
		const headPosition = new THREE.Vector3();

		headBoneRef.current.getWorldPosition(headPosition);
		const targetPosition = new THREE.Vector3();
		targetPosition.copy(camera.position);
		const lookAtVector = new THREE.Vector3();
		lookAtVector.subVectors(targetPosition, headPosition).normalize();

		const isBottomRow =
			playerPositionRoom >= Math.floor(Object.keys(seedData).length / 2);

		const targetAngle =
			Math.atan2(lookAtVector.x, lookAtVector.z) -
			headOffset +
			(isBottomRow ? Math.PI : 0);
		const currentAngle = headBoneRef.current.rotation.y;

		const angleDiff = THREE.MathUtils.degToRad(
			(((THREE.MathUtils.radToDeg(targetAngle - currentAngle) % 360) + 540) %
				360) -
				180
		);

		headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
			currentAngle,
			currentAngle + angleDiff,
			0.1
		);
	});

	useFrame(({ camera, clock }) => {
		if (monsterState === 'facingCamera') {
			lookAtCamera(camera);
			if (
				Object.values(seedData)[playerPositionRoom]?.monsterInitialRotation?.[0]
			) {
				group.current.rotation.x = 2.7;
				group.current.rotation.y = group.current.rotation.y / 1.5 + 0.2;
				group.current.rotation.z = 0;
			}
		} else if (monsterState === 'run' || monsterState === 'chase') {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			const delta = Math.max(clock.getDelta(), 0.016);
			runAtCamera(camera, delta, monsterState);
		} else if (monsterState === 'leaving') {
			const hideSpot = useHiding.getState().hideSpot;
			const isRightSide = playerPositionRoom >= roomCount / 2;
			const rightOffset = 1.76;

			let targetPosition;
			let targetRotation = 0;

			if (
				(hideSpot === 'roomCurtain' && !roomCurtain) ||
				(hideSpot === 'desk' && !deskDoor)
			) {
				targetPosition = new THREE.Vector3(
					-0.91 + (isRightSide ? rightOffset : 0),
					0,
					1.19 * (isRightSide ? -1 : 1)
				);
				targetRotation = isRightSide ? Math.PI : 0;
			} else if (hideSpot === 'nightstand' && !nightstandDoor) {
				targetPosition = new THREE.Vector3(
					-0.69 + (isRightSide ? rightOffset : -0.42),
					-0.5,
					4.21 * (isRightSide ? -1 : 1)
				);
				targetRotation = isRightSide ? Math.PI / 2 : -Math.PI / 2;
			} else if (hideSpot === 'bathroomCurtain' && !bathroomCurtain) {
				targetPosition = new THREE.Vector3(
					-0.78 + (isRightSide ? rightOffset : -0.26),
					0,
					3.18 * (isRightSide ? -1 : 1)
				);
				targetRotation = isRightSide ? 1 : Math.PI + 1;
			} else {
				setShakeIntensity(10);
				setMonsterState('run');
				playAnimation('Run');
				setAnimationSpeed(1);
				return;
			}

			const CORRIDOR_LENGTH = 5.95;
			let roomX;
			if (playerPositionRoom >= roomCount / 2) {
				roomX = -(playerPositionRoom - roomCount / 2) * CORRIDOR_LENGTH;
			} else {
				roomX = -playerPositionRoom * CORRIDOR_LENGTH;
			}
			const roomPosition = new THREE.Vector3(roomX, 0, 0);
			targetPosition.add(roomPosition);

			group.current.position.copy(targetPosition);
			group.current.rotation.y = targetRotation;

			if (!isWaiting) {
				setAnimationMixSpeed(1);
				playAnimation('Creeping');
				setAnimationSpeed(1);

				if (hideSpot === 'bathroomCurtain') {
					setBathroomDoors(playerPositionRoom, true);
				}

				setIsWaiting(true);
				timeoutRef.current = setTimeout(() => {
					setRoomDoor(playerPositionRoom, false);

					group.current.position.y = 10;
					setMonsterPosition([
						group.current.position.x,
						10,
						group.current.position.z,
					]);

					setMonsterState('hiding');
					playAnimation('Idle');

					setIsWaiting(false);
				}, 5000);
			}
		}
	});

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<group>
			<group
				position={monsterPosition}
				rotation={monsterRotation}
				scale={1.1}
				ref={group}
				{...props}
				dispose={null}
			>
				{!isLoading && <Animations group={group} animations={animations} />}
				<group name="Scene">
					<group name="Armature" scale={0.01}>
						<group name="Ch30" rotation={[Math.PI / 2, 0, 0]}>
							{visibleParts.skeleton && (
								<primitive object={nodes.mixamorigHips} />
							)}
							{visibleParts.body && (
								<skinnedMesh
									name="Ch30_primitive0"
									geometry={nodes.Ch30_primitive0.geometry}
									material={materials.Ch30_Body1}
									skeleton={nodes.Ch30_primitive0.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.arms && (
								<skinnedMesh
									name="Ch30_primitive1"
									geometry={nodes.Ch30_primitive1.geometry}
									material={materials.Ch30_Body}
									skeleton={nodes.Ch30_primitive1.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.head && (
								<skinnedMesh
									name="Ch30_primitive2"
									geometry={nodes.Ch30_primitive2.geometry}
									material={materials['Material.001']}
									skeleton={nodes.Ch30_primitive2.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.legs && (
								<skinnedMesh
									name="Ch30_primitive3"
									geometry={nodes.Ch30_primitive3.geometry}
									material={materials.Material}
									skeleton={nodes.Ch30_primitive3.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.details && (
								<>
									<skinnedMesh
										name="Ch30_primitive4"
										geometry={nodes.Ch30_primitive4.geometry}
										material={materials['Material.002']}
										skeleton={nodes.Ch30_primitive4.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
									<skinnedMesh
										name="Ch30_primitive5"
										geometry={nodes.Ch30_primitive5.geometry}
										material={materials['Material.011']}
										skeleton={nodes.Ch30_primitive5.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
									<skinnedMesh
										name="Ch30_primitive6"
										geometry={nodes.Ch30_primitive6.geometry}
										material={materials['Material.016']}
										skeleton={nodes.Ch30_primitive6.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
								</>
							)}
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

// useGLTF.preload('/models/monster.glb');

export default Monster;
