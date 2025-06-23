import React, { useState, useEffect } from 'react';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useGridStore from '../../../hooks/useGrid';
import useDoor from '../../../hooks/useDoor';
import useMonster from '../../../hooks/useMonster';
import useLight from '../../../hooks/useLight';
import useLocalization from '../../../hooks/useLocalization';
import { FaSteam } from 'react-icons/fa';
import { getDeathReasonTranslationKey } from '../../../utils/deathReasonMapper';
import { regenerateData } from '../../../utils/config';
import {
	getWeightedRandomSound,
	CCB_DEATH_SOUNDS,
	getAudioInstance,
} from '../../../utils/audio';
import {
	isPointerLocked,
	exitPointerLock,
	requestPointerLock,
} from '../../../utils/pointerLock';
import AnimatedDeathLogo from './AnimatedDeathLogo';
import FirstDeathPopup from './FirstDeathPopup';
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
	const [animationsComplete, setAnimationsComplete] = useState(false);
	const [showFirstDeathPopup, setShowFirstDeathPopup] = useState(false);

	const { t } = useLocalization();
	const deviceMode = useGame((state) => state.deviceMode);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const incrementRealDeaths = useGame((state) => state.incrementRealDeaths);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const seedData = useGame((state) => state.seedData);
	const customMessage = useGame((state) => state.customDeathMessage);
	const seenLevels = useGame((state) => state.seenLevels);
	const totalLevelTypes = useGame((state) => state.totalLevelTypes);
	const addSeenLevel = useGame((state) => state.addSeenLevel);
	const realDeaths = useGame((state) => state.realDeaths);
	const hasShownFirstDeathPopup = useGame(
		(state) => state.hasShownFirstDeathPopup
	);
	const setHasShownFirstDeathPopup = useGame(
		(state) => state.setHasShownFirstDeathPopup
	);

	useEffect(() => {
		if (openDeathScreen) {
			setAnimationsComplete(false);
			const timer = setTimeout(() => {
				setAnimationsComplete(true);
			}, 3500);

			const isCCBMode =
				window.location.hash.includes('CCB') ||
				window.location.pathname.includes('CCB');
			if (isCCBMode) {
				const ccbDeathSoundTimer = setTimeout(() => {
					const randomDeathSound = getWeightedRandomSound(
						CCB_DEATH_SOUNDS,
						'deaths'
					);
					const ccbDeathAudio = getAudioInstance(randomDeathSound);
					if (ccbDeathAudio) {
						ccbDeathAudio.currentTime = 0;
						ccbDeathAudio.volume = 0.7;
						ccbDeathAudio.play().catch(() => {});
					}
				}, 2000);

				return () => {
					clearTimeout(timer);
					clearTimeout(ccbDeathSoundTimer);
				};
			}

			return () => clearTimeout(timer);
		}
	}, [openDeathScreen]);

	useEffect(() => {
		if (playerPositionRoom !== null && playerPositionRoom >= 0) {
			const currentRoom = Object.values(seedData)[playerPositionRoom];
			let message = null;

			if (customMessage) {
				message = customMessage.startsWith('game.deathReasons.')
					? t(customMessage)
					: customMessage;
			} else if (currentRoom?.isRaid) {
				message = t('game.deathReasons.raidKnocking');
			} else if (currentRoom?.deathReason) {
				const translationKey = getDeathReasonTranslationKey(
					currentRoom.deathReason
				);
				message = translationKey.startsWith('game.deathReasons.')
					? t(translationKey)
					: currentRoom.deathReason;
			}

			setLastDeathMessage(message);

			if (currentRoom?.baseKey) {
				addSeenLevel(currentRoom.baseKey);
			}
		}
	}, [playerPositionRoom, seedData, customMessage, addSeenLevel, t]);

	useEffect(() => {
		if (openDeathScreen) {
			if (isPointerLocked()) {
				exitPointerLock();
			}

			const preventPointerLock = (e) => {
				if (!animationsComplete || showFirstDeathPopup) {
					e.preventDefault();
					exitPointerLock();
				}
			};

			document.addEventListener('pointerlockchange', preventPointerLock);

			return () => {
				document.removeEventListener('pointerlockchange', preventPointerLock);
			};
		}
	}, [openDeathScreen, animationsComplete, showFirstDeathPopup]);

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
					const aButtonPressed = gamepad.buttons[0]?.pressed; // A button
					const xButtonPressed = gamepad.buttons[2]?.pressed; // X button
					const leftTriggerPressed = gamepad.buttons[6]?.pressed; // L2/LT
					const rightTriggerPressed = gamepad.buttons[7]?.pressed; // R2/RT
					const actionPressed =
						aButtonPressed ||
						xButtonPressed ||
						leftTriggerPressed ||
						rightTriggerPressed;

					if (
						actionPressed &&
						!isRestarting &&
						animationsComplete &&
						!showFirstDeathPopup
					) {
						if (realDeaths === 0 && !hasShownFirstDeathPopup) {
							setShowFirstDeathPopup(true);
							return;
						}

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
		animationsComplete,
		showFirstDeathPopup,
		realDeaths,
		hasShownFirstDeathPopup,
	]);

	const handleRestart = () => {
		if (isRestarting || !animationsComplete || showFirstDeathPopup) return;

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

	const handleSteamWishlistClick = (e) => {
		e.stopPropagation();
		window.open(
			'https://store.steampowered.com/app/3739730/Skull_Hotel/',
			'_blank'
		);
	};

	const handleFirstDeathPopupClose = () => {
		setShowFirstDeathPopup(false);
		setHasShownFirstDeathPopup(true);
	};

	const handleFirstDeathPopupWishlist = () => {
		handleSteamWishlistClick({ stopPropagation: () => {} });
		setShowFirstDeathPopup(false);
		setHasShownFirstDeathPopup(true);
	};

	const handleDeathScreenClick = (e) => {
		if (realDeaths === 0 && !hasShownFirstDeathPopup && animationsComplete) {
			setShowFirstDeathPopup(true);
			return;
		}

		if (showFirstDeathPopup) {
			return;
		}

		handleRestart();
	};

	if (!openDeathScreen) return null;

	return (
		<>
			<div className="death-screen" onClick={handleDeathScreenClick}>
				<AnimatedDeathLogo />
				<div className="death-screen-flex">
					<div className="death-screen-title">
						{t('ui.deathScreen.youDied')}
					</div>
					<div className="death-message">
						{lastDeathMessage}
						<div className="death-message-count">
							{seenLevels.size}/{totalLevelTypes}{' '}
							{t('ui.deathScreen.hidingSpotsFound')}
						</div>
					</div>
				</div>
				<div className="death-screen-start-container">
					<div className="death-screen-start">
						<>
							{isRestarting
								? t('ui.deathScreen.restarting')
								: t('ui.deathScreen.continue')}
						</>
					</div>
				</div>
			</div>

			<FirstDeathPopup
				isVisible={showFirstDeathPopup}
				onClose={handleFirstDeathPopupClose}
				onWishlist={handleFirstDeathPopupWishlist}
			/>
		</>
	);
};

export default DeathScreen;
