import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import { usePositionalSound } from '../../utils/audio';
import * as THREE from 'three';

const CORRIDORLENGTH = 5.95;
const DOOR_SPEED = 2;

export default function DoorWrapper({
	children,
	roomNumber,
	isOpen,
	setOpen,
	setHandlePressed,
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
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const cursorRef = useRef(null);
	const setCursor = useInterface((state) => state.setCursor);
	const canOpenRef = useRef(false);
	const rotationAngleRef = useRef(0);
	const animationProgressRef = useRef(0);
	const hasLookedAtGroup = useRef(false);
	const [isInRoom, setIsInRoom] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);

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

		// Adjust Y position for adjacent doors when in a room (not in corridor)
		if (playerPositionRoom !== null && !closet && isInRoom) {
			const isAdjacent = Math.abs(roomNumber - playerPositionRoom) === 1;
			if (isAdjacent) {
				calculatedPosition[1] = 10;
			}
		}

		return !roomNumber && roomNumber !== 0 ? offset : calculatedPosition;
	}, [
		roomNumber,
		roomTotal,
		offset,
		tutorialRoomOffset,
		playerPositionRoom,
		closet,
		isInRoom,
	]);

	const initialRotationY = useMemo(() => {
		let rotation = rotate ? Math.PI : position[2] < 0 ? Math.PI : 0;
		if (doubleRotate) {
			rotation += Math.PI / 2;
		}
		return rotation;
	}, [rotate, position, doubleRotate]);

	const openSound = usePositionalSound(closet ? 'closetOpen' : 'doorOpen');
	const closeSound = usePositionalSound(closet ? 'closetClose' : 'doorClose');
	const beepSound = usePositionalSound('beep');

	useEffect(() => {
		if (hasInitialized) {
			if (isOpen) {
				if (openRef.current && !openRef.current.isPlaying) {
					openRef.current.play();
					if (!closet && beepRef.current && !beepRef.current.isPlaying) {
						beepRef.current.play();
					}
				}
			} else {
				setTimeout(() => {
					if (closeRef.current && !closeRef.current.isPlaying) {
						closeRef.current.play();
					}
				}, 800);
			}
		} else if (isOpen) {
			setHasInitialized(true);
		}
	}, [isOpen, hasInitialized, closet]);

	useEffect(() => {
		const handlePointerDown = (e) => {
			if (e.button === 0 && canOpenRef.current && setHandlePressed) {
				setHandlePressed(true);
			}
		};

		const handlePointerUp = (e) => {
			if (e.button === 0 && canOpenRef.current) {
				if (setHandlePressed) setHandlePressed(false);
				setOpen(!isOpen);
				animationProgressRef.current = 0;
			}
		};

		window.addEventListener('pointerdown', handlePointerDown);
		window.addEventListener('pointerup', handlePointerUp);

		return () => {
			window.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	}, [canOpenRef, isOpen, setOpen, setHandlePressed]);

	useEffect(() => {
		if (doorRef.current) {
			doorRef.current.position.set(position[0], position[1], position[2]);
		}
	}, [position]);

	useFrame(({ camera }, delta) => {
		if (!doorRef.current) return;

		// Update isInRoom based on camera position
		setIsInRoom(Math.abs(camera.position.z) > 1.3);

		const doorPosition = doorRef.current.position;
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
				if (!cursorRef.current?.includes('door')) {
					cursorRef.current = 'door';
					setCursor('door');
				}
				if (!canOpenRef.current) canOpenRef.current = true;
				if (!hasLookedAtGroup.current) hasLookedAtGroup.current = true;
			} else {
				if (hasLookedAtGroup.current) {
					if (cursorRef.current?.includes('door')) {
						cursorRef.current = null;
						setCursor(null);
					}
					if (hasLookedAtGroup.current) hasLookedAtGroup.current = false;
				}
				if (canOpenRef.current) canOpenRef.current = false;
			}
		} else {
			if (canOpenRef.current) canOpenRef.current = false;

			if (hasLookedAtGroup.current) {
				if (cursorRef.current?.includes('door')) {
					cursorRef.current = null;
					setCursor(null);
				}
				hasLookedAtGroup.current = false;
			}
		}

		const directionMultiplier = reverse ? -1 : 1;
		const currentTargetAngle = !isOpen ? 0 : targetAngle * directionMultiplier;

		if (instantChange) {
			rotationAngleRef.current = currentTargetAngle;
		} else {
			animationProgressRef.current = Math.min(
				animationProgressRef.current + delta * DOOR_SPEED,
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
		}

		const quaternion = new THREE.Quaternion();
		quaternion.setFromEuler(
			new THREE.Euler(0, initialRotationY + rotationAngleRef.current, 0)
		);
		if (doorRef.current) {
			doorRef.current.setRotationFromQuaternion(quaternion);
		}
	});

	return (
		<group dispose={null}>
			<group ref={doorRef}>
				{hasInitialized && (
					<group>
						<PositionalAudio ref={openRef} {...openSound} loop={false} />
						<PositionalAudio ref={closeRef} {...closeSound} loop={false} />
						{!closet && (
							<PositionalAudio ref={beepRef} {...beepSound} loop={false} />
						)}
					</group>
				)}
				<group ref={group} dispose={null}>
					{children}
				</group>
			</group>
		</group>
	);
}
