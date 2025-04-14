import { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useMonster from '../../hooks/useMonster';
import useJoysticks from '../../hooks/useJoysticks';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import useGamepadControls from '../../hooks/useGamepadControls';

const GRID_OFFSET_Z = 150;
const LERP_FACTOR = 0.2;
const PROGRESS_THRESHOLD = 0.001;

export default function Crouch({
	isCrouchingRef,
	crouchProgressRef,
	playerPosition,
}) {
	const isPlaying = useGame((state) => state.isPlaying);
	const getCell = useGridStore((state) => state.getCell);
	const monsterState = useMonster((state) => state.monsterState);
	const controls = useJoysticks((state) => state.controls);
	const isMobile = useGame((state) => state.isMobile);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wantsToStandUpRef = useRef(false);
	const [gridOffsetX, setGridOffsetX] = useState(0);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);
	const introIsPlaying = useGame((state) => state.introIsPlaying);
	const [isCrouchLocked, setIsCrouchLocked] = useState(false);
	const lastCrouchStateRef = useRef(false);

	const resetCrouchState = useCallback(() => {
		isCrouchingRef.current = false;
		crouchProgressRef.current = 0;
		wantsToStandUpRef.current = false;
		setIsCrouchLocked(false);
	}, [isCrouchingRef, crouchProgressRef]);

	useEffect(() => {
		if (monsterState === 'run') {
			resetCrouchState();
		}
	}, [monsterState, resetCrouchState]);

	useEffect(() => {
		setGridOffsetX(roomCount * 29.5 + 10);
	}, [roomCount]);

	const checkCrouchArea = useCallback(
		(position) => {
			const cellX = Math.floor(position.x * 10 + gridOffsetX);
			const cellZ = Math.floor(position.z * 10 + GRID_OFFSET_Z);
			const cell = getCell(cellX, cellZ);
			return (
				cell.type === CELL_TYPES.CROUCH_ONLY ||
				cell.type === CELL_TYPES.DESK_DOOR_CLOSED ||
				cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED
			);
		},
		[getCell, gridOffsetX]
	);

	const toggleCrouchLock = useCallback(() => {
		if (monsterState === 'run' || isAnyPopupOpen || introIsPlaying) return;

		if (isCrouchLocked && checkCrouchArea(playerPosition.current)) return;

		setIsCrouchLocked((prev) => !prev);

		if (!isCrouchLocked) {
			isCrouchingRef.current = true;
			wantsToStandUpRef.current = false;
		} else {
			if (!checkCrouchArea(playerPosition.current)) {
				isCrouchingRef.current = false;
			}
		}
	}, [
		isCrouchLocked,
		checkCrouchArea,
		playerPosition,
		isCrouchingRef,
		monsterState,
		isAnyPopupOpen,
		introIsPlaying,
	]);

	const handleCrouchChange = useCallback(
		(shouldCrouch) => {
			if (monsterState === 'run' || isAnyPopupOpen || introIsPlaying) return;

			if (shouldCrouch !== lastCrouchStateRef.current) {
				if (shouldCrouch) {
					toggleCrouchLock();
				}
				lastCrouchStateRef.current = shouldCrouch;
			}
		},
		[toggleCrouchLock, monsterState, isAnyPopupOpen, introIsPlaying]
	);

	useEffect(() => {
		if (isMobile) return;
		if (deviceMode !== 'keyboard') return;

		const handleKeyDown = (event) => {
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				if (!event.repeat) {
					handleCrouchChange(true);
				}
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				handleCrouchChange(false);
				if (!checkCrouchArea(playerPosition.current)) {
					wantsToStandUpRef.current = true;
				}
			}
		};

		const preventCtrlCombinations = (event) => {
			if (event.ctrlKey) {
				event.preventDefault();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('keydown', preventCtrlCombinations);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('keydown', preventCtrlCombinations);
		};
	}, [
		handleCrouchChange,
		isMobile,
		deviceMode,
		checkCrouchArea,
		playerPosition,
	]);

	useEffect(() => {
		if (isMobile) return;
		if (deviceMode !== 'gamepad') return;

		let lastGamepadCrouchState = false;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (gamepadControls.crouch !== lastGamepadCrouchState) {
				if (gamepadControls.crouch) {
					handleCrouchChange(true);
				} else {
					handleCrouchChange(false);
				}
				lastGamepadCrouchState = gamepadControls.crouch;
			}
		};

		const interval = setInterval(checkGamepad, 16); // ~60fps

		return () => clearInterval(interval);
	}, [handleCrouchChange, deviceMode, gamepadControlsRef, isMobile]);

	useEffect(() => {
		if (!isMobile) return;

		handleCrouchChange(controls.crouch);
	}, [controls.crouch, handleCrouchChange, isMobile]);

	useFrame(() => {
		if (!isPlaying || isAnyPopupOpen || introIsPlaying) {
			return;
		}

		if (isCrouchLocked) {
			isCrouchingRef.current = true;
		} else if (
			wantsToStandUpRef.current &&
			!checkCrouchArea(playerPosition.current)
		) {
			isCrouchingRef.current = false;
			wantsToStandUpRef.current = false;
		}

		const targetProgress =
			monsterState === 'run' || !isCrouchingRef.current ? 0 : 1;
		const newProgress =
			crouchProgressRef.current +
			(targetProgress - crouchProgressRef.current) * LERP_FACTOR;

		if (
			Math.abs(newProgress - crouchProgressRef.current) > PROGRESS_THRESHOLD
		) {
			crouchProgressRef.current = newProgress;
		}
	});

	return null;
}
