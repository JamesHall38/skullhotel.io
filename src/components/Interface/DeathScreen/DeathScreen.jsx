import React, { useState, useEffect } from 'react';
// import { TbXboxAFilled, TbXboxXFilled } from 'react-icons/tb';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useGridStore from '../../../hooks/useGrid';
import useDoor from '../../../hooks/useDoor';
import useMonster from '../../../hooks/useMonster';
import useLight from '../../../hooks/useLight';
import { regenerateData } from '../../../utils/config';
import {
	isPointerLocked,
	exitPointerLock,
	requestPointerLock,
} from '../../../utils/pointerLock';
import AnimatedDeathLogo from './AnimatedDeathLogo';
import './DeathScreen.css';

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
	useGame.getState().setPlayIntro(true);
	useLight.getState().restart();
	useInterface.getState().setIsSettingsOpen(false);
	useInterface.getState().setTutorialObjectives([true, true, true]);
}

const DeathScreen = () => {
	const [isRestarting, setIsRestarting] = useState(false);
	const [lastDeathMessage, setLastDeathMessage] = useState(null);

	const deviceMode = useGame((state) => state.deviceMode);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const incrementRealDeaths = useGame((state) => state.incrementRealDeaths);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const seedData = useGame((state) => state.seedData);
	const customMessage = useGame((state) => state.customDeathMessage);

	useEffect(() => {
		if (playerPositionRoom !== null && playerPositionRoom >= 0) {
			const currentRoom = Object.values(seedData)[playerPositionRoom];
			const message =
				customMessage ||
				(currentRoom?.isRaid
					? 'If you hear a client knocking at the door, hide until they leave'
					: currentRoom?.deathReason);
			setLastDeathMessage(message);
		}
	}, [playerPositionRoom, seedData, customMessage]);

	useEffect(() => {
		if (openDeathScreen && deviceMode === 'keyboard') {
			if (isPointerLocked()) {
				exitPointerLock();
			}
		}
	}, [openDeathScreen, deviceMode]);

	useEffect(() => {
		if (openDeathScreen) {
			setIsGameplayActive(false);
		}
	}, [openDeathScreen, setIsGameplayActive]);

	useEffect(() => {
		if (!openDeathScreen || deviceMode !== 'gamepad') return;

		const checkGamepadXButton = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			for (const gamepad of gamepads) {
				if (gamepad && gamepad.connected) {
					const xButtonPressed = gamepad.buttons[2]?.pressed;
					const leftTriggerPressed = gamepad.buttons[6]?.pressed; // L2/LT
					const rightTriggerPressed = gamepad.buttons[7]?.pressed; // R2/RT
					const actionPressed =
						xButtonPressed || leftTriggerPressed || rightTriggerPressed;

					if (actionPressed && !isRestarting) {
						setIsRestarting(true);
						setTimeout(() => {
							resetGame();
							regenerateData();
							useGridStore.getState().initializeIfNeeded();
							setTimeout(() => {
								setIsGameplayActive(true);
								setOpenDeathScreen(false);
								setIsRestarting(false);

								setTimeout(() => {
									useInterface.getState().setCurrentDialogueIndex(1);
									setTimeout(() => {
										useInterface.getState().setCurrentDialogueIndex(null);
									}, 3000);
								}, 1500);
							}, 100);
						}, 500);
					}
				}
			}
		};

		const interval = setInterval(checkGamepadXButton, 100);
		return () => clearInterval(interval);
	}, [
		openDeathScreen,
		deviceMode,
		setOpenDeathScreen,
		isRestarting,
		setIsGameplayActive,
	]);

	const handleRestart = () => {
		if (isRestarting) return;

		setIsRestarting(true);
		incrementRealDeaths();

		setTimeout(() => {
			resetGame();
			regenerateData();
			useGridStore.getState().initializeIfNeeded();
			setTimeout(() => {
				setOpenDeathScreen(false);
				setIsRestarting(false);
				setIsGameplayActive(true);

				if (deviceMode === 'keyboard') {
					const canvas = document.querySelector('canvas');
					if (canvas && !isPointerLocked()) {
						requestPointerLock(canvas);
					}
				}

				setTimeout(() => {
					useInterface.getState().setCurrentDialogueIndex(1);
					setTimeout(() => {
						useInterface.getState().setCurrentDialogueIndex(null);
					}, 3000);
				}, 1500);
			}, 100);
		}, 500);
	};

	if (!openDeathScreen) return null;

	return (
		<div className="death-screen" onClick={handleRestart}>
			<AnimatedDeathLogo />
			<div className="death-screen-flex">
				<div className="death-screen-title">YOU DIED</div>
				<div className="death-message">{lastDeathMessage}</div>
			</div>
			<div className="death-screen-start">
				{/* {deviceMode === 'gamepad' ? (
					<>
						<TbXboxAFilled
							style={{ verticalAlign: 'middle', marginRight: '5px' }}
						/>{' '}
						or{' '}
						<TbXboxXFilled
							style={{
								verticalAlign: 'middle',
								marginLeft: '5px',
								marginRight: '5px',
							}}
						/>{' '}
						to start
					</>
				) : (
					<>{isRestarting ? 'Restarting...' : 'CONTINUE'}</>
				)} */}
				<>{isRestarting ? 'Restarting...' : 'CONTINUE'}</>
			</div>
		</div>
	);
};

export default DeathScreen;
