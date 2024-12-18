import { useRef, useEffect, useCallback, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Blood from './Blood';
import * as THREE from 'three';
import Animations from './Animations';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import { findPath } from './pathfinding';

const BASE_SPEED = 2;
const CHASE_SPEED = 0.5;
const NEXT_POINT_THRESHOLD = 0.5;
const MIN_DISTANCE_FOR_RECALCULATION = 2;
const ATTACK_DISTANCE = 0.8;

const Monster = (props) => {
	const group = useRef();
	const { nodes, materials, animations } = useGLTF('/models/monster.glb');
	const seedData = useGame((state) => state.seedData);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const monsterState = useMonster((state) => state.monsterState);
	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const playAnimation = useMonster((state) => state.playAnimation);
	const setIsAttacking = useMonster((state) => state.setIsAttacking);
	const setAnimationSpeed = useMonster((state) => state.setAnimationSpeed);
	const [currentPath, setCurrentPath] = useState(null);
	const headBoneRef = useRef();
	const lastTargetRef = useRef({ x: 0, z: 0 });

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

			const distanceToCamera =
				group.current.position.distanceTo(targetPosition);

			if (distanceToCamera <= ATTACK_DISTANCE) {
				setIsAttacking(true);
				playAnimation('Attack');
				setAnimationSpeed(1);

				const direction = new THREE.Vector3();
				direction
					.subVectors(group.current.position, targetPosition)
					.normalize();

				const distanceToMove = (ATTACK_DISTANCE - distanceToCamera) * delta;
				group.current.position.x += direction.x * distanceToMove;
				group.current.position.y = 0.08;
				group.current.position.z += direction.z * distanceToMove;

				camera.position.y = 1.585;

				group.current.lookAt(
					targetPosition.x,
					group.current.position.y,
					targetPosition.z
				);

				camera.lookAt(
					group.current.position.x,
					group.current.position.y + 1.42,
					group.current.position.z
				);
			} else {
				if (monsterState !== 'chase') {
					playAnimation('Run');
				} else {
					playAnimation('Walk');
				}

				if (mode === 'run') {
					const direction = new THREE.Vector3(
						camera.position.x - group.current.position.x,
						0,
						camera.position.z - group.current.position.z
					).normalize();

					const moveSpeed = speed * delta;
					group.current.position.add(direction.multiplyScalar(moveSpeed));

					group.current.lookAt(
						camera.position.x,
						group.current.position.y,
						camera.position.z
					);
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
						setCurrentPath(newPath);
						lastTargetRef.current = { x: targetX, z: targetZ };
					}

					if (currentPath && currentPath.length > 1) {
						const nextPoint = currentPath[1];

						const direction = new THREE.Vector3(
							(nextPoint.x - offsetX) / 10 - group.current.position.x,
							0,
							(nextPoint.z - offsetZ) / 10 - group.current.position.z
						).normalize();

						const moveSpeed = speed * delta;

						group.current.position.add(direction.multiplyScalar(moveSpeed));

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
					}
				}
			}
		},
		[
			playAnimation,
			currentPath,
			setAnimationSpeed,
			setIsAttacking,
			monsterState,
			lookAtCamera,
		]
	);

	useEffect(() => {
		if (nodes.Mesh.skeleton) {
			const headBone = nodes.Mesh.skeleton.bones.find(
				(bone) => bone.name === 'mixamorigHead'
			);

			if (headBone) {
				headBoneRef.current = headBone;
			}
		}
	}, [nodes]);

	useFrame(({ camera, clock }) => {
		if (
			headBoneRef.current &&
			monsterState !== 'run' &&
			monsterState !== 'chase' &&
			monsterState !== 'facingCamera'
		) {
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
		}

		if (monsterState === 'facingCamera') {
			lookAtCamera(camera);
			if (
				Object.values(seedData)[playerPositionRoom]?.monsterInitialRotation?.[0]
			) {
				group.current.rotation.x = 2.7;
				group.current.rotation.y = group.current.rotation.y / 1.5 + 0.2;
				group.current.rotation.z = 0;
			}
		} else if (monsterState === 'run') {
			runAtCamera(camera, clock.getDelta() * 100, 'run');
		} else if (monsterState === 'chase') {
			runAtCamera(camera, clock.getDelta() * 100, 'chase');
		}
	});

	return (
		<group>
			<group scale={1.1} position={monsterPosition}>
				{Object.keys(seedData)[playerPositionRoom] === 'bloodOnBath' ||
					(Object.keys(seedData)[playerPositionRoom] === 'bloodOnDoor' && (
						<Blood />
					))}
			</group>
			<group
				position={monsterPosition}
				rotation={monsterRotation}
				scale={1.1}
				ref={group}
				{...props}
				dispose={null}
			>
				<Animations group={group} animations={animations} />
				<group name="Scene">
					<group name="Armature" scale={0.01}>
						<group name="Ch30" rotation={[Math.PI / 2, 0, 0]}>
							<primitive object={nodes.mixamorigHips} />
							<skinnedMesh
								name="Mesh"
								geometry={nodes.Mesh.geometry}
								material={materials.Ch30_Body1}
								skeleton={nodes.Mesh.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_1"
								geometry={nodes.Mesh_1.geometry}
								material={materials.Ch30_Body}
								skeleton={nodes.Mesh_1.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_2"
								geometry={nodes.Mesh_2.geometry}
								material={materials['Material.001']}
								skeleton={nodes.Mesh_2.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_3"
								geometry={nodes.Mesh_3.geometry}
								material={materials.Material}
								skeleton={nodes.Mesh_3.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_4"
								geometry={nodes.Mesh_4.geometry}
								material={materials['Material.002']}
								skeleton={nodes.Mesh_4.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_5"
								geometry={nodes.Mesh_5.geometry}
								material={materials['Material.011']}
								skeleton={nodes.Mesh_5.skeleton}
								frustumCulled={false}
							/>
							<skinnedMesh
								name="Mesh_6"
								geometry={nodes.Mesh_6.geometry}
								material={materials['Material.016']}
								skeleton={nodes.Mesh_6.skeleton}
								frustumCulled={false}
							/>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

useGLTF.preload('/models/monster.glb');

export default Monster;
