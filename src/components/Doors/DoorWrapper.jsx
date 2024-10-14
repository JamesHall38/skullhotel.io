import { useEffect, useRef, useState, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;
const DOOR_SPEED = 2;

export default function DoorWrapper({
	children,
	roomNumber,
	isOpen,
	setOpen,
	reverse,
	rotate,
	offset,
	tutorialRoomOffset,
	instantChange,
	closet = false,
	doubleRotate = false,
}) {
	const doorRef = useRef();
	const group = useRef();
	const openRef = useRef();
	const closeRef = useRef();
	const beepRef = useRef();
	const roomTotal = useGame((state) => state.roomTotal);
	const cursor = useInterface((state) => state.cursor);
	const setCursor = useInterface((state) => state.setCursor);
	const [canOpen, setCanOpen] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const rotationAngleRef = useRef(0);
	const animationProgressRef = useRef(0);
	const hasLookedAtGroup = useRef(false);

	const targetAngle = useMemo(() => {
		let angle = reverse ? -Math.PI / 2 : Math.PI / 2;
		return angle;
	}, [reverse]);

	const position = useMemo(() => {
		let calculatedPosition = null;
		if (roomNumber >= roomTotal / 2)
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(roomNumber - roomTotal / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		else
			calculatedPosition = [
				-(offset[0] - 5.91) - roomNumber * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];

		if (tutorialRoomOffset) {
			calculatedPosition = tutorialRoomOffset;
		}

		return !roomNumber && roomNumber !== 0 ? offset : calculatedPosition;
	}, [roomNumber, roomTotal, offset, tutorialRoomOffset]);

	const initialRotationY = useMemo(() => {
		let rotation = rotate ? Math.PI : position[2] < 0 ? Math.PI : 0;
		if (doubleRotate) {
			rotation += Math.PI / 2;
		}
		return rotation;
	}, [rotate, position, doubleRotate]);

	useEffect(() => {
		if (hasInitialized) {
			if (isOpen) {
				openRef.current.play();
				if (!closet) {
					beepRef.current.play();
				}
			} else {
				setTimeout(() => {
					closeRef.current.play();
				}, 800);
			}
		} else if (isOpen) {
			setHasInitialized(true);
		}
	}, [isOpen, hasInitialized, closet]);

	useEffect(() => {
		const handleClick = () => {
			if (canOpen) {
				setOpen(!isOpen);
				animationProgressRef.current = 0;
			}
		};

		window.addEventListener('click', handleClick);
		return () => window.removeEventListener('click', handleClick);
	}, [canOpen, isOpen, setOpen]);

	useEffect(() => {
		if (doorRef.current) {
			const newPosition = new THREE.Vector3(
				position[0],
				position[1],
				position[2]
			);
			doorRef.current.setNextKinematicTranslation(newPosition);
		}
	}, [position]);

	useFrame(({ camera }, delta) => {
		if (!doorRef.current) return;

		const doorPosition = doorRef.current.translation();
		const distance = new THREE.Vector3(
			doorPosition.x,
			doorPosition.y,
			doorPosition.z
		).distanceTo(camera.position);

		if (distance < 3) {
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
			const intersects = raycaster.intersectObject(group.current, true);

			if (intersects.length > 0) {
				setCursor('door');
				setCanOpen(true);
				hasLookedAtGroup.current = true;
			} else {
				if (cursor === 'door' && hasLookedAtGroup.current) {
					setCursor(null);
					hasLookedAtGroup.current = false;
				}
				setCanOpen(false);
			}
		} else {
			setCanOpen(false);

			if (hasLookedAtGroup.current) {
				setCursor(null);
				hasLookedAtGroup.current = false;
			}
		}

		const directionMultiplier = reverse ? -1 : 1;
		const currentTargetAngle = !isOpen ? 0 : targetAngle * directionMultiplier;

		animationProgressRef.current = Math.min(
			animationProgressRef.current +
				delta * DOOR_SPEED * (instantChange ? 20 : 1),
			1
		);
		const easeInOut = (t) => t * t * (3 - 2 * t) * 0.05;
		const easedProgress = easeInOut(animationProgressRef.current);

		const newAngle = THREE.MathUtils.lerp(
			rotationAngleRef.current,
			currentTargetAngle,
			easedProgress
		);
		rotationAngleRef.current = newAngle;

		const quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(new THREE.Euler(0, initialRotationY + newAngle, 0));
		if (doorRef.current) {
			doorRef.current.setNextKinematicRotation(quaternion);
		}
	});

	return (
		<group dispose={null}>
			<RigidBody
				friction={0}
				restitution={0.2}
				type="kinematicPosition"
				ref={doorRef}
				colliders="cuboid"
			>
				{hasInitialized && (
					<group>
						<PositionalAudio
							ref={openRef}
							url={closet ? '/sounds/closet_open.ogg' : '/sounds/open.ogg'}
							loop={false}
							distance={1}
							refDistance={1}
							rolloffFactor={1}
							volume={closet ? 1 : 0.5}
						/>
						<PositionalAudio
							ref={closeRef}
							url={closet ? '/sounds/closet_close.ogg' : '/sounds/close.ogg'}
							loop={false}
							distance={1}
							refDistance={1}
							rolloffFactor={1}
							volume={closet ? 1 : 0.5}
						/>
						{!closet && (
							<PositionalAudio
								ref={beepRef}
								url="/sounds/beep.ogg"
								loop={false}
								distance={1}
								refDistance={1}
								rolloffFactor={1}
								volume={0.5}
							/>
						)}
					</group>
				)}
				<group ref={group} dispose={null}>
					{children}
				</group>
			</RigidBody>
		</group>
	);
}
