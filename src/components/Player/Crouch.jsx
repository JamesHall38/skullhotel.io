import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import useGridStore, { CELL_TYPES } from '../../hooks/useGrid';
import useMonster from '../../hooks/useMonster';
import useJoysticks from '../../hooks/useJoysticks';

const GRID_OFFSET_X = 600;
const GRID_OFFSET_Z = 150;
const LERP_FACTOR = 0.2;
const PROGRESS_THRESHOLD = 0.001;

export default function Crouch({
	isCrouchingRef,
	crouchProgressRef,
	playerPosition,
}) {
	const getCell = useGridStore((state) => state.getCell);
	const monsterState = useMonster((state) => state.monsterState);
	const controls = useJoysticks((state) => state.controls);
	const wantsToStandUpRef = useRef(false);

	const resetCrouchState = useCallback(() => {
		isCrouchingRef.current = false;
		crouchProgressRef.current = 0;
		wantsToStandUpRef.current = false;
	}, [isCrouchingRef, crouchProgressRef]);

	useEffect(() => {
		if (monsterState === 'run') {
			resetCrouchState();
		}
	}, [monsterState, resetCrouchState]);

	const checkCrouchArea = useCallback(
		(position) => {
			const cellX = Math.floor(position.x * 10 + GRID_OFFSET_X);
			const cellZ = Math.floor(position.z * 10 + GRID_OFFSET_Z);
			const cell = getCell(cellX, cellZ);
			return (
				cell.type === CELL_TYPES.CROUCH_ONLY ||
				cell.type === CELL_TYPES.DESK_DOOR_CLOSED ||
				cell.type === CELL_TYPES.NIGHTSTAND_DOOR_CLOSED
			);
		},
		[getCell]
	);

	const handleCrouchChange = useCallback(
		(shouldCrouch) => {
			if (monsterState === 'run') return;

			if (shouldCrouch) {
				isCrouchingRef.current = true;
			} else if (!checkCrouchArea(playerPosition.current)) {
				isCrouchingRef.current = false;
			} else {
				wantsToStandUpRef.current = true;
			}
		},
		[checkCrouchArea, playerPosition, isCrouchingRef, monsterState]
	);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				handleCrouchChange(true);
			}
			if (event.ctrlKey) {
				event.preventDefault();
			}
		};

		const handleKeyUp = (event) => {
			if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
				handleCrouchChange(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [handleCrouchChange]);

	// Add effect to handle mobile crouch button
	useEffect(() => {
		if (controls.crouch) {
			handleCrouchChange(true);
		} else {
			handleCrouchChange(false);
		}
	}, [controls.crouch, handleCrouchChange]);

	useFrame(() => {
		if (wantsToStandUpRef.current && !checkCrouchArea(playerPosition.current)) {
			isCrouchingRef.current = false;
			wantsToStandUpRef.current = false;
		}

		// Lerp the crouch progress
		const targetProgress =
			monsterState === 'run' || !isCrouchingRef.current ? 0 : 1;
		const newProgress =
			crouchProgressRef.current +
			(targetProgress - crouchProgressRef.current) * LERP_FACTOR;

		// Only update if the change is significant
		if (
			Math.abs(newProgress - crouchProgressRef.current) > PROGRESS_THRESHOLD
		) {
			crouchProgressRef.current = newProgress;
		}
	});

	return null;
}
