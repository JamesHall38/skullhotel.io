import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { useGLTF, useAnimations, PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import * as THREE from 'three';

const MAX_DISTANCE = 2;
const MAX_ANGLE = Math.PI / 4;
const CORRIDORLENGTH = 5.95;
const offset = [9.53, 0.83, 1.6];

export default function Bottles() {
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomTotal = useGame((state) => state.roomTotal);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const group = useRef();
	const { nodes, materials, animations } = useGLTF(
		'/models/objectives/bottles.glb'
	);
	const { actions } = useAnimations(animations, group);
	const { camera } = useThree();
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const objective = useInterface(
		(state) => state.interfaceObjectives[roomNumber]?.[0]
	);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const [delayedBathroomCurtain, setDelayedBathroomCurtain] =
		useState(bathroomCurtain);

	const bottleSoundRef = useRef();

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDelayedBathroomCurtain(bathroomCurtain);
		}, 500);

		return () => clearTimeout(timeout);
	}, [bathroomCurtain]);

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
			calculatedPosition = [2.32, 0 + offset[1], 3.28];
		}

		return calculatedPosition;
	}, [playerPositionRoom, roomTotal, camera]);

	const checkDistanceAndAngle = useCallback(() => {
		const objectPosition = new THREE.Vector3(...position);
		const cameraPosition = camera.position;
		const distance = cameraPosition.distanceTo(objectPosition);

		const objectDirection = new THREE.Vector3()
			.subVectors(objectPosition, cameraPosition)
			.normalize();
		const cameraDirection = new THREE.Vector3(0, 0, -1)
			.applyQuaternion(camera.quaternion)
			.normalize();
		const angle = objectDirection.angleTo(cameraDirection);

		return distance < MAX_DISTANCE && angle < MAX_ANGLE;
	}, [camera, position]);

	useEffect(() => {
		const onClick = () => {
			if (checkDistanceAndAngle() && delayedBathroomCurtain) {
				Object.values(actions).forEach((action) => {
					if (!action.isRunning()) {
						if (action && action.time !== action.getClip().duration) {
							action.clampWhenFinished = true;
							action.loop = THREE.LoopOnce;
							action.repetitions = 1;

							// Play the bottle sound
							setTimeout(() => {
								if (bottleSoundRef.current) {
									bottleSoundRef.current.play();
								}
							}, 600);

							action.play();
							setInterfaceObjectives(0, roomNumber);
						}
					}
				});
			}
		};
		document.addEventListener('click', onClick);

		return () => {
			document.removeEventListener('click', onClick);
		};
	}, [
		actions,
		delayedBathroomCurtain,
		camera,
		checkDistanceAndAngle,
		setInterfaceObjectives,
		roomNumber,
	]);

	const isInit = useRef(false);

	useEffect(() => {
		if (objective === false && isInit.current === true) {
			Object.values(actions).forEach((action) => {
				if (action) {
					action.stop();
					action.reset();
				}
			});
		} else {
			isInit.current = true;
		}
	}, [objective, actions]);

	return (
		<group
			ref={group}
			position={position}
			rotation={[0, position[2] < 0 ? Math.PI : 0, 0]}
			dispose={null}
		>
			<group name="Scene">
				<group name="BottleRight">
					<mesh
						name="Cylinder013"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder013.geometry}
						material={materials['1.003']}
					/>
					<mesh
						name="Cylinder013_1"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder013_1.geometry}
						material={materials.g1}
					/>
				</group>
				<group name="BottleLeft" rotation={[-Math.PI / 2, 0.056, 0]}>
					<mesh
						name="Cylinder008"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008.geometry}
						material={materials['89']}
					/>
					<mesh
						name="Cylinder008_1"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008_1.geometry}
						material={materials['3-1']}
					/>
					<mesh
						name="Cylinder008_2"
						castShadow
						receiveShadow
						geometry={nodes.Cylinder008_2.geometry}
						material={materials['2-2.001']}
					/>
				</group>
			</group>
			<PositionalAudio
				ref={bottleSoundRef}
				url="/sounds/bottles.ogg"
				loop={false}
				distance={1}
				refDistance={1}
				rolloffFactor={1}
				volume={0.5}
			/>
		</group>
	);
}

useGLTF.preload('/models/objectives/bottles.glb');
