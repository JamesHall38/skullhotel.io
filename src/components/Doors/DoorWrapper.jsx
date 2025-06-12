import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import { usePositionalSound } from '../../utils/audio';
import * as THREE from 'three';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGamepadControls from '../../hooks/useGamepadControls';

const CORRIDORLENGTH = 5.95;
const DOOR_SPEED = 0.05;

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
	isNightstand = false,
}) {
	const doorRef = useRef();
	const group = useRef();
	const openRef = useRef();
	const closeRef = useRef();
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);
	const endAnimationPlaying = useGame((state) => state.endAnimationPlaying);
	const introIsPlaying = useGame((state) => state.introIsPlaying);
	const endAnimationPlayingRef = useRef(endAnimationPlaying);
	const introIsPlayingRef = useRef(introIsPlaying);
	const cursorRef = useRef(null);
	const setCursor = useInterface((state) => state.setCursor);
	const canOpenRef = useRef(false);
	const rotationAngleRef = useRef(0);
	const animationProgressRef = useRef(0);
	const hasLookedAtGroup = useRef(false);
	const [isInRoom, setIsInRoom] = useState(false);
	const [hasInitialized, setHasInitialized] = useState(false);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);

	useEffect(() => {
		endAnimationPlayingRef.current = endAnimationPlaying;
	}, [endAnimationPlaying]);

	useEffect(() => {
		introIsPlayingRef.current = introIsPlaying;
	}, [introIsPlaying]);

	const targetAngle = useMemo(() => {
		let angle = reverse ? -Math.PI / 2 : Math.PI / 2;
		return angle;
	}, [reverse]);

	const position = useMemo(() => {
		let calculatedPosition = null;
		if (roomNumber >= roomCount / 2)
			calculatedPosition = [
				offset[0] -
					CORRIDORLENGTH -
					(roomNumber - roomCount / 2) * CORRIDORLENGTH,
				offset[1],
				-offset[2],
			];
		else
			calculatedPosition = [
				-(offset[0] - 5.91) - roomNumber * CORRIDORLENGTH,
				offset[1],
				offset[2],
			];

		if (isTutorialOpen && tutorialRoomOffset) {
			return tutorialRoomOffset;
		}

		if (playerPositionRoom !== null && !closet && isInRoom) {
			const isAdjacent = Math.abs(roomNumber - playerPositionRoom) === 1;
			if (isAdjacent) {
				calculatedPosition[1] = 10;
			}
		}

		return !roomNumber && roomNumber !== 0 ? offset : calculatedPosition;
	}, [
		roomNumber,
		roomCount,
		offset,
		tutorialRoomOffset,
		playerPositionRoom,
		closet,
		isInRoom,
		isTutorialOpen,
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

	useEffect(() => {
		if (hasInitialized) {
			if (!endAnimationPlayingRef.current && !introIsPlayingRef.current) {
				if (isOpen) {
					if (openRef.current && !openRef.current.isPlaying) {
						openRef.current.play();
					}
				} else {
					setTimeout(() => {
						if (
							closeRef.current &&
							!closeRef.current.isPlaying &&
							!endAnimationPlayingRef.current &&
							!introIsPlayingRef.current
						) {
							closeRef.current.play();
						}
					}, 800);
				}
			}
		} else if (isOpen) {
			setHasInitialized(true);
		}
	}, [isOpen, hasInitialized, closet]);

	useEffect(() => {
		if (deviceMode !== 'keyboard') return;

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
	}, [canOpenRef, isOpen, setOpen, setHandlePressed, deviceMode]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (
				gamepadControls.action &&
				!wasActionPressedRef.current &&
				canOpenRef.current
			) {
				if (setHandlePressed) setHandlePressed(true);
				wasActionPressedRef.current = true;
			} else if (
				!gamepadControls.action &&
				wasActionPressedRef.current &&
				canOpenRef.current
			) {
				if (setHandlePressed) setHandlePressed(false);
				setOpen(!isOpen);
				animationProgressRef.current = 0;
				wasActionPressedRef.current = false;
			}
		};

		const interval = setInterval(checkGamepad, 16); // ~60fps

		return () => clearInterval(interval);
	}, [
		deviceMode,
		gamepadControlsRef,
		canOpenRef,
		isOpen,
		setOpen,
		setHandlePressed,
	]);

	useEffect(() => {
		if (doorRef.current) {
			doorRef.current.position.set(position[0], position[1], position[2]);
		}
	}, [position]);

	useFrame(({ camera }, delta) => {
		if (!doorRef.current) return;

		setIsInRoom(Math.abs(camera.position.z) > 1.3);

		const doorPosition = doorRef.current.position;
		const distance = new THREE.Vector3(
			doorPosition.x,
			doorPosition.y,
			doorPosition.z
		).distanceTo(camera.position);

		if (distance < 3) {
			if (
				isNightstand &&
				(Math.abs(camera.position.z) < 4.2 ||
					(camera.position.z < 5.9 && camera.position.x > 1.9)) &&
				!(camera.position.z < -4.7 && camera.position.x > 1.7)
			) {
				if (cursorRef.current?.includes('door')) {
					cursorRef.current = null;
					setCursor(null);
				}
				if (canOpenRef.current) canOpenRef.current = false;
				return;
			}

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
			const lerpFactor = Math.min(delta * 60 * DOOR_SPEED, 1);

			const newAngle = THREE.MathUtils.lerp(
				rotationAngleRef.current,
				currentTargetAngle,
				lerpFactor
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
					</group>
				)}
				<group ref={group} dispose={null}>
					{children}
				</group>
			</group>
		</group>
	);
}
