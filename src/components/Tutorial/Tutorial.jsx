import React, {
	useEffect,
	useRef,
	useState,
	useCallback,
	useMemo,
} from 'react';
import { useFrame } from '@react-three/fiber';
import Inscriptions from './Inscriptions';
import Instructions from './Instructions';
import useInterfaceStore from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import useGame from '../../hooks/useGame';
import useHiding from '../../hooks/useHiding';
import useLocalization from '../../hooks/useLocalization';

const TUTORIAL_STAGE = {
	INTRO: 1,
	INTERACT: 2,
	CLOSE_DOOR: 3,
	DOOR_CLOSED: 4,
	LISTEN: 5,
	BATHROOM_WARNING: 6,
	FURNITURE_HIDING: 7,
	CHECK_NIGHTSTAND: 8,
	CLOSE_NIGHTSTAND: 9,
	CLEAN_OBJECTIVES: 10,
	WELL_DONE: 11,
	FINAL_WARNING: 12,
	LEAVE_TUTORIAL: 13,
};

// Dialogue constants (matching src/components/Interface/dialogues.js)
const WELCOME_BACK_DIALOGUE = 1; // 'Welcome back.',
const WELCOME_DIALOGUE = 2; // 'Welcome. You must be the new housekeeper.',
const DOOR_CLOSED_DIALOGUE = 3; // 'Always close doors behind you or they might enter while you clean the room.',
const BATHROOM_WARNING_DIALOGUE = 4; // 'If you hear sounds coming from the bathroom, do not open it and leave.',
const UNUSUAL_WARNING_DIALOGUE = 5; // 'If there is something unusual happening, hide immediately.',
const CHECK_FURNITURE_DIALOGUE = 6; // 'Check the whole room for their presence',
const NIGHTSTAND_WARNING_DIALOGUE = 7; // 'If you see one of them, be quick to close and leave the room.',
const WELL_DONE_DIALOGUE = 8; // 'Well done! Now clean 8 rooms to call it a day.',
const REMEMBER_WARNING_DIALOGUE = 9; // 'Remember: if you see one of them in a room, turn back immediately.'
const OCCUPIED_ROOMS_DIALOGUE = 10; // 'Half of these rooms are randomly occupied. Proceed with caution.',

export default function Tutorial() {
	const isDead = useInterfaceStore((state) => state.isDead);
	const corridorDoorOpen = useDoor((state) => state.corridor);
	const tutorialDoorOpen = useDoor((state) => state.tutorial);
	const nightStandOpen = useDoor((state) => state.nightStand);
	const setNightStandOpen = useDoor((state) => state.setNightStand);
	const bathroomCurtain = useDoor((state) => state.bathroomCurtain);
	const hideSpot = useHiding((state) => state.hideSpot);
	const isPlayerHidden = useHiding((state) => state.isPlayerHidden);
	const alternateTutorialRoom = useGame((state) => state.alternateTutorialRoom);
	const isListening = useGame((state) => state.isListening);
	const playIntro = useGame((state) => state.playIntro);
	const deaths = useGame((state) => state.deaths);
	const setMannequinHidden = useGame((state) => state.setMannequinHidden);

	const [tutorialStage, setTutorialStage] = useState(0);
	const [listeningTimer, setListeningTimer] = useState(0);
	const [hasListenedEnough, setHasListenedEnough] = useState(false);
	const timeoutRef = useRef(null);
	const hasTriggered = useRef(false);
	const hasStarted = useRef(false);
	const doorClosedRef = useRef(false);
	const step10CompletedRef = useRef(false);
	const step11CompletedRef = useRef(false);
	const [hasOpenedBathroomCurtain, setHasOpenedBathroomCurtain] =
		useState(false);
	const [doorClosed, setDoorClosed] = useState(false);
	const [triggerStep2, setTriggerStep2] = useState(false);
	const [triggerStep3, setTriggerStep3] = useState(false);
	const [listeningProgress, setListeningProgress] = useState(0);

	const currentDialogueIndex = useInterfaceStore(
		(state) => state.currentDialogueIndex
	);
	const setCurrentDialogueIndex = useInterfaceStore(
		(state) => state.setCurrentDialogueIndex
	);
	const tutorialObjectives = useInterfaceStore(
		(state) => state.tutorialObjectives
	);
	const setCustomTutorialObjectives = useInterfaceStore(
		(state) => state.setCustomTutorialObjectives
	);
	const customTutorialObjectives = useInterfaceStore(
		(state) => state.customTutorialObjectives
	);
	const setIsTutorialCompleted = useInterfaceStore(
		(state) => state.setIsTutorialCompleted
	);

	const { t, currentLanguage } = useLocalization();

	// Welcome back on death
	useEffect(() => {
		if (
			isDead &&
			(tutorialStage === TUTORIAL_STAGE.FINAL_WARNING ||
				tutorialStage === TUTORIAL_STAGE.LEAVE_TUTORIAL)
		) {
			setCurrentDialogueIndex(WELCOME_BACK_DIALOGUE);
		}
	}, [isDead, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 1: INTRO - Welcome and movement controls
	// ===========================
	useEffect(() => {
		if (!hasStarted.current) {
			if (playIntro && currentDialogueIndex === null) {
				hasStarted.current = true;
				timeoutRef.current = setTimeout(() => {
					if (deaths === 0) {
						setTutorialStage(TUTORIAL_STAGE.INTRO);
						setTimeout(() => {
							setCurrentDialogueIndex(WELCOME_DIALOGUE);
						}, 2000);
					}
				}, 3000);
			}
		}
	}, [playIntro, deaths, currentDialogueIndex, setCurrentDialogueIndex]);

	// ===========================
	// STEP 2: INTERACT - X to interact, clean room objective
	// ===========================
	const TRIGGER_X_POSITION = 7.5;
	useFrame(({ camera }) => {
		if (hasTriggered.current || tutorialStage !== TUTORIAL_STAGE.INTRO) {
			return;
		}

		if (camera.position.x < TRIGGER_X_POSITION) {
			hasTriggered.current = true;
			setTriggerStep2(true);
		}
	});

	useEffect(() => {
		if (triggerStep2 && tutorialStage === TUTORIAL_STAGE.INTRO) {
			setTutorialStage(TUTORIAL_STAGE.INTERACT);
		}
	}, [triggerStep2, tutorialStage]);

	// ===========================
	// STEP 3: CLOSE_DOOR - Close the door behind you
	// ===========================
	const TRIGGER_Z_POSITION = 3;
	useFrame(({ camera }) => {
		if (
			tutorialStage === TUTORIAL_STAGE.INTERACT &&
			camera.position.z > TRIGGER_Z_POSITION
		) {
			setTriggerStep3(true);
		}
	});

	useEffect(() => {
		if (triggerStep3 && tutorialStage === TUTORIAL_STAGE.INTERACT) {
			setTutorialStage(TUTORIAL_STAGE.CLOSE_DOOR);
		}
	}, [triggerStep3, tutorialStage]);

	// ===========================
	// STEP 4: DOOR_CLOSED - Confirmation after door is closed
	// ===========================
	useFrame(({ camera }) => {
		if (
			tutorialStage === TUTORIAL_STAGE.CLOSE_DOOR &&
			!tutorialDoorOpen &&
			!doorClosedRef.current &&
			camera.position.z > TRIGGER_Z_POSITION
		) {
			doorClosedRef.current = true;
			setDoorClosed(true);
		}
	});

	useEffect(() => {
		if (doorClosed && tutorialStage === TUTORIAL_STAGE.CLOSE_DOOR) {
			setTutorialStage(TUTORIAL_STAGE.DOOR_CLOSED);
			setCurrentDialogueIndex(DOOR_CLOSED_DIALOGUE);
		}
	}, [doorClosed, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 5: LISTEN - Y to listen for sounds
	// ===========================
	const LISTENING_TIME_REQUIRED = 2; // seconds
	useFrame((state, delta) => {
		if (tutorialStage === TUTORIAL_STAGE.DOOR_CLOSED && isListening) {
			const newTime = listeningTimer + delta;
			setListeningProgress(newTime);
			if (newTime >= LISTENING_TIME_REQUIRED && !hasListenedEnough) {
				setListeningProgress(LISTENING_TIME_REQUIRED);
			}
		} else if (!isListening && listeningTimer > 0) {
			setListeningProgress(0);
		}
	});

	useEffect(() => {
		setListeningTimer(listeningProgress);

		if (
			listeningProgress >= LISTENING_TIME_REQUIRED &&
			!hasListenedEnough &&
			tutorialStage === TUTORIAL_STAGE.DOOR_CLOSED
		) {
			setHasListenedEnough(true);
			setTutorialStage(TUTORIAL_STAGE.LISTEN);
			setCurrentDialogueIndex(BATHROOM_WARNING_DIALOGUE);
		}
	}, [
		listeningProgress,
		hasListenedEnough,
		tutorialStage,
		setCurrentDialogueIndex,
	]);

	// ===========================
	// STEP 6: BATHROOM_WARNING - Hide in bathroom
	// ===========================
	useEffect(() => {
		if (bathroomCurtain) {
			setHasOpenedBathroomCurtain(true);
		}
	}, [bathroomCurtain]);

	useEffect(() => {
		if (
			tutorialStage === TUTORIAL_STAGE.LISTEN &&
			hideSpot === 'bathroomCurtain' &&
			isPlayerHidden
		) {
			setTutorialStage(TUTORIAL_STAGE.BATHROOM_WARNING);
			setCurrentDialogueIndex(UNUSUAL_WARNING_DIALOGUE);
		}
	}, [hideSpot, isPlayerHidden, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 7: FURNITURE_HIDING - Hide in desk
	// ===========================
	useEffect(() => {
		if (
			tutorialStage === TUTORIAL_STAGE.BATHROOM_WARNING &&
			hideSpot === 'desk' &&
			isPlayerHidden
		) {
			setNightStandOpen(false);

			setTimeout(() => {
				setMannequinHidden(false);
			}, 1000);
			setTutorialStage(TUTORIAL_STAGE.FURNITURE_HIDING);
			setCurrentDialogueIndex(CHECK_FURNITURE_DIALOGUE);
		}
	}, [hideSpot, isPlayerHidden, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 8: CHECK_NIGHTSTAND - Open nightstand
	// ===========================
	useEffect(() => {
		if (tutorialStage === TUTORIAL_STAGE.FURNITURE_HIDING && nightStandOpen) {
			setTutorialStage(TUTORIAL_STAGE.CHECK_NIGHTSTAND);
			setCurrentDialogueIndex(NIGHTSTAND_WARNING_DIALOGUE);
		}
	}, [nightStandOpen, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 9: CLOSE_NIGHTSTAND - Close nightstand with warning
	// ===========================
	useEffect(() => {
		if (tutorialStage === TUTORIAL_STAGE.CHECK_NIGHTSTAND && !nightStandOpen) {
			setTimeout(() => {
				setTutorialStage(TUTORIAL_STAGE.CLOSE_NIGHTSTAND);
			}, 200);
		}
	}, [nightStandOpen, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// STEP 10: CLEAN_OBJECTIVES - Original cleaning tasks
	// ===========================
	useEffect(() => {
		if (
			tutorialObjectives.every(Boolean) &&
			!step10CompletedRef.current &&
			tutorialStage === TUTORIAL_STAGE.CLOSE_NIGHTSTAND
		) {
			step10CompletedRef.current = true;
			setTutorialStage(TUTORIAL_STAGE.CLEAN_OBJECTIVES);
			setIsTutorialCompleted(true);
			setCurrentDialogueIndex(WELL_DONE_DIALOGUE);

			setTimeout(() => {
				setCurrentDialogueIndex(REMEMBER_WARNING_DIALOGUE);
			}, 11000);
		}
	}, [
		tutorialObjectives,
		tutorialStage,
		setCurrentDialogueIndex,
		setIsTutorialCompleted,
	]);

	// ===========================
	// STEP 11: WELL_DONE - Completion of objectives
	// ===========================
	useEffect(() => {
		if (
			corridorDoorOpen &&
			tutorialStage === TUTORIAL_STAGE.CLEAN_OBJECTIVES &&
			!step11CompletedRef.current
		) {
			step11CompletedRef.current = true;
			setTutorialStage(TUTORIAL_STAGE.WELL_DONE);
			setCurrentDialogueIndex(OCCUPIED_ROOMS_DIALOGUE);
		}
	}, [corridorDoorOpen, tutorialStage, setCurrentDialogueIndex]);

	// ===========================
	// INSTRUCTIONS
	// ===========================

	const instructionStageInfo = useMemo(() => {
		switch (tutorialStage) {
			case TUTORIAL_STAGE.INTRO:
				return { showMovement: true };
			case TUTORIAL_STAGE.INTERACT:
				return { showInteraction: true };
			case TUTORIAL_STAGE.CLOSE_DOOR:
				return { showInteraction: true };
			case TUTORIAL_STAGE.DOOR_CLOSED:
				return { showListening: true };
			case TUTORIAL_STAGE.LISTEN:
				if (hasOpenedBathroomCurtain) {
					return { showJump: true };
				} else {
					return { showJump: true, showBathroomHiding: true };
				}
			case TUTORIAL_STAGE.BATHROOM_WARNING:
				return { showCrouch: true, showDeskHiding: true };
			case TUTORIAL_STAGE.FURNITURE_HIDING:
				return { showInteraction: true, showNightstandHiding: true };
			case TUTORIAL_STAGE.CHECK_NIGHTSTAND:
				return { showInteraction: true, showNightstandHiding: true };
			case TUTORIAL_STAGE.CLOSE_NIGHTSTAND:
				return { showArrows: true };
			case TUTORIAL_STAGE.CLEAN_OBJECTIVES:
				return { showArrows: true };
			default:
				return {};
		}
	}, [tutorialStage, hasOpenedBathroomCurtain]);

	// ===========================
	// OBJECTIVES
	// ===========================

	const getCurrentObjectives = useCallback(() => {
		switch (tutorialStage) {
			case TUTORIAL_STAGE.INTERACT:
				return [t('ui.tutorial.objectives.enterTutorialRoom')];
			case TUTORIAL_STAGE.CLOSE_DOOR:
				return [t('ui.tutorial.objectives.closeDoor')];
			case TUTORIAL_STAGE.DOOR_CLOSED:
				return [t('ui.tutorial.objectives.listenBathroomDoor')];
			case TUTORIAL_STAGE.LISTEN:
				return [t('ui.tutorial.objectives.hideBehindCurtains')];
			case TUTORIAL_STAGE.BATHROOM_WARNING:
				return [t('ui.tutorial.objectives.hideInsideDesk')];
			case TUTORIAL_STAGE.FURNITURE_HIDING:
				return [t('ui.tutorial.objectives.checkNightstand')];
			case TUTORIAL_STAGE.CHECK_NIGHTSTAND:
				return [t('ui.tutorial.objectives.closeNightstandDoor')];
			case TUTORIAL_STAGE.CLOSE_NIGHTSTAND:
				return [
					t('ui.objectives.refillSoapBottles'),
					t('ui.objectives.makeTheBed'),
					t('ui.objectives.openTheWindow'),
				];
			case TUTORIAL_STAGE.CLEAN_OBJECTIVES:
				return [];
			default:
				return [];
		}
	}, [tutorialStage, t]);

	useEffect(() => {
		if (tutorialStage >= TUTORIAL_STAGE.INTRO) {
			const objectives = getCurrentObjectives().map((text) => ({
				text,
				completed: false,
			}));
			setTimeout(() => {
				setCustomTutorialObjectives(objectives);
			}, 50);
		}
	}, [tutorialStage, setCustomTutorialObjectives, getCurrentObjectives]);

	useEffect(() => {
		if (
			tutorialStage >= TUTORIAL_STAGE.CLOSE_NIGHTSTAND &&
			customTutorialObjectives &&
			customTutorialObjectives.length > 0
		) {
			const updatedObjectives = customTutorialObjectives.map(
				(objective, index) => {
					if (tutorialObjectives[index] === true) {
						return { ...objective, completed: true };
					}
					return objective;
				}
			);

			if (
				JSON.stringify(updatedObjectives) !==
				JSON.stringify(customTutorialObjectives)
			) {
				setCustomTutorialObjectives(updatedObjectives);
			}
		}
	}, [
		tutorialStage,
		tutorialObjectives,
		customTutorialObjectives,
		setCustomTutorialObjectives,
	]);

	useEffect(() => {
		if (customTutorialObjectives && customTutorialObjectives.length > 0) {
			const updatedObjectives = getCurrentObjectives().map((text, index) => ({
				text,
				completed: customTutorialObjectives[index]?.completed || false,
			}));

			const hasTextChanged = updatedObjectives.some(
				(obj, index) => obj.text !== customTutorialObjectives[index]?.text
			);

			if (hasTextChanged) {
				setCustomTutorialObjectives(updatedObjectives);
			}
		}
	}, [
		currentLanguage,
		customTutorialObjectives,
		getCurrentObjectives,
		setCustomTutorialObjectives,
	]);

	return (
		<group>
			{alternateTutorialRoom ? (
				<Inscriptions endTitle />
			) : (
				<>
					<Instructions
						tutorialStage={tutorialStage}
						stageInfo={instructionStageInfo}
					/>
				</>
			)}
		</group>
	);
}
