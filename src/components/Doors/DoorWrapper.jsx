import { useEffect, useRef, useState, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;

export default function DoorWrapper({
	children,
	roomNumber,
	isOpen,
	setOpen,
	reverse,
	rotate,
	offset,
	instantChange,
	closet = false,
}) {
	const doorRef = useRef();
	const group = useRef();
	const openRef = useRef();
	const closeRef = useRef();
	const beepRef = useRef();
	const roomTotal = useGame((state) => state.roomTotal);
	const setInterfaceAction = useInterface((state) => state.setInterfaceAction);
	const [canOpen, setCanOpen] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const rotationAngleRef = useRef(0);
	const animationProgressRef = useRef(0);
	const targetAngle = reverse ? -Math.PI / 2 : Math.PI / 2;
	const doorSpeed = 2;

	const position = useMemo(() => {
		if (!roomNumber && roomNumber !== 0) return offset;
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
	}, [roomNumber, roomTotal, offset]);

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

	const initialRotationY = useMemo(
		() => (rotate ? -Math.PI / 2 : position[2] < 0 ? Math.PI : 0),
		[rotate, position]
	);

	useFrame(({ camera }, delta) => {
		if (!group.current || !doorRef.current) return;

		const doorPosition = group.current.position;
		const distance = doorPosition.distanceTo(camera.position);

		if (distance < 3) {
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
			const intersects = raycaster.intersectObject(group.current, true);

			if (intersects.length > 0) {
				setInterfaceAction('Click to open');
				setCanOpen(true);
			} else {
				setCanOpen(false);
				setInterfaceAction('');
			}
		} else {
			setCanOpen(false);
		}

		const directionMultiplier = reverse ? -1 : 1;
		const currentTargetAngle = !isOpen ? 0 : targetAngle * directionMultiplier;

		animationProgressRef.current = Math.min(
			animationProgressRef.current +
				delta * doorSpeed * (instantChange ? 20 : 1),
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
		<group
			ref={group}
			position={position}
			rotation={[0, rotate ? -Math.PI / 2 : position[2] < 0 ? Math.PI : 0, 0]}
			dispose={null}
		>
			<RigidBody
				friction={0}
				restitution={0.2}
				type="kinematicPosition"
				ref={doorRef}
			>
				<PositionalAudio
					ref={openRef}
					url={closet ? '/sounds/closetOpen.ogg' : '/sounds/open.ogg'}
					loop={false}
					distance={1}
					refDistance={1}
					rolloffFactor={1}
					volume={closet ? 1 : 0.5}
				/>
				<PositionalAudio
					ref={closeRef}
					url={closet ? '/sounds/closetClose.ogg' : '/sounds/close.ogg'}
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
				{children}
			</RigidBody>
		</group>
	);
}
