import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Inscriptions from './Inscriptions';
import Instructions from './Instructions';
import useInterfaceStore from '../../hooks/useInterface';
import useDoorStore from '../../hooks/useDoor';
import useGameStore from '../../hooks/useGame';

const WELCOME_DIALOGUE = 1;
const CLEAN_TUTORIAL_DIALOGUE = 2;
const WELL_DONE_DIALOGUE = 3;
const OCCUPIED_ROOMS_DIALOGUE = 4;
const WELCOME_BACK_DIALOGUE = 5;

const TRIGGER_X_POSITION = 7.5;

export default function Tutorial() {
	const hasTriggered = useRef(false);
	const timeoutRef = useRef(null);
	const currentDialogueIndex = useInterfaceStore(
		(state) => state.currentDialogueIndex
	);
	const setCurrentDialogueIndex = useInterfaceStore(
		(state) => state.setCurrentDialogueIndex
	);
	const tutorialObjectives = useInterfaceStore(
		(state) => state.tutorialObjectives
	);
	const isDead = useInterfaceStore((state) => state.isDead);
	const corridorDoorOpen = useDoorStore((state) => state.corridor);
	const playIntro = useGameStore((state) => state.playIntro);
	const deaths = useGameStore((state) => state.deaths);

	useEffect(() => {
		if (!playIntro && currentDialogueIndex === null) {
			timeoutRef.current = setTimeout(() => {
				setCurrentDialogueIndex(
					deaths > 0 ? WELCOME_BACK_DIALOGUE : WELCOME_DIALOGUE
				);
			}, 3000);

			return () => {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}
			};
		}
	}, [playIntro, deaths, currentDialogueIndex, setCurrentDialogueIndex]);

	useFrame(({ camera }) => {
		if (hasTriggered.current || currentDialogueIndex !== WELCOME_DIALOGUE) {
			return;
		}

		if (camera.position.x < TRIGGER_X_POSITION) {
			setCurrentDialogueIndex(CLEAN_TUTORIAL_DIALOGUE);
			hasTriggered.current = true;
		}
	});

	useEffect(() => {
		if (
			tutorialObjectives.every(Boolean) &&
			currentDialogueIndex === CLEAN_TUTORIAL_DIALOGUE
		) {
			setCurrentDialogueIndex(WELL_DONE_DIALOGUE);
		}
	}, [tutorialObjectives, currentDialogueIndex, setCurrentDialogueIndex]);

	useEffect(() => {
		if (corridorDoorOpen && currentDialogueIndex === WELL_DONE_DIALOGUE) {
			setCurrentDialogueIndex(OCCUPIED_ROOMS_DIALOGUE);
		}
	}, [corridorDoorOpen, currentDialogueIndex, setCurrentDialogueIndex]);

	useEffect(() => {
		if (isDead && currentDialogueIndex === OCCUPIED_ROOMS_DIALOGUE) {
			setCurrentDialogueIndex(WELCOME_BACK_DIALOGUE);
		}
	}, [isDead, currentDialogueIndex, setCurrentDialogueIndex]);

	return (
		<group>
			<Inscriptions />
			<Instructions />
		</group>
	);
}
