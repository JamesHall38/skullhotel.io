import React, {
	useRef,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import Animations from './Animations';
import useGame from '../../hooks/useGame';
import useDoor from '../../hooks/useDoor';
import useInterface from '../../hooks/useInterface';

export default function Mannequin() {
	const group = useRef();
	const openedTutorialDoor = useRef(false);
	const { nodes, animations } = useGLTF('/models/wooden_mannequin.glb');
	const { actions } = useAnimations(animations, group);
	const [animationName, setAnimationName] = useState('wave');
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const tutorialDoor = useDoor((state) => state.tutorial);
	const mannequinHidden = useGame((state) => state.mannequinHidden);
	const [lastValidConfig, setLastValidConfig] = useState({
		position: [0, 1, 0],
		rotation: [0, Math.PI / 2, 0],
		scale: 1,
		animation: 'wave',
	});

	const interfaceObjectives = useInterface(
		(state) => state.interfaceObjectives
	);

	const doneObjectives = useMemo(() => {
		return interfaceObjectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [interfaceObjectives]);

	const mannequinParts = useMemo(
		() => [
			{ name: 'hips', label: 'Base' },
			{ name: 'hips_L004', label: 'Left Leg' },
			{ name: 'hips_R004', label: 'Right Leg' },
			{ name: 'hips_L005', label: 'Left Arm' },
			{ name: 'hips_R005', label: 'Right Arm' },
			{ name: 'handL001', label: 'Left Hand' },
			{ name: 'handR001', label: 'Right Hand' },
			{ name: 'upper_armL001', label: 'Left Upper Arm' },
			{ name: 'upper_armR001', label: 'Right Upper Arm' },
		],
		[]
	);

	const objectivePoses = useMemo(
		() => [
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'wave',
			}, // 0 objectives - Happy & waving
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'idle',
			}, // 1 objective - Looking normal
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'nervous',
			}, // 2 objectives - Starting to look nervous
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'scared',
			}, // 3 objectives - Visibly scared (hands on head)
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'panic',
			}, // 4 objectives - Panicking
			{
				position: [4.15, 0.84, -0.95],
				rotation: [0, -2, 0],
				scale: 1,
				animation: 'despair',
			}, // 5 objectives - Crouching in despair
			{
				position: [4.31, 0.84, -0.95],
				rotation: [0, -Math.PI / 2, 0],
				scale: 1,
				animation: 'injured',
			}, // 6 objectives - Injured/broken posture
			{
				position: [4.31, 0.84, -0.95],
				rotation: [0, -Math.PI / 2, 0],
				scale: 1,
				animation: 'headless',
			}, // 7 objectives - Decapitated/dead pose
		],
		[]
	);

	const tutorialConfiguration = useMemo(
		() => ({
			position: [-1.35, mannequinHidden ? 10 : 0.08, -1.28],
			rotation: [0, Math.PI / 2, 0],
			scale: 5,
			animation: 'hide',
		}),
		[mannequinHidden]
	);

	const { loadedItems, isLoading } = useProgressiveLoad(
		mannequinParts,
		'Mannequin'
	);

	const visibleParts = useMemo(() => {
		return mannequinParts.reduce((acc, part) => {
			acc[part.name] = loadedItems.some((item) => item.name === part.name);
			return acc;
		}, {});
	}, [loadedItems, mannequinParts]);

	const playAnimation = useCallback(
		(name) => {
			if (animationName === name) return;

			if (actions && actions[name]) {
				group.current.userData.currentAnimation = name;
				setAnimationName(name);
			}
		},
		[actions, animationName]
	);

	useEffect(() => {
		openedTutorialDoor.current = false;
	}, [playerPositionRoom]);

	useEffect(() => {
		let newConfig;

		if (tutorialDoor && !openedTutorialDoor.current) {
			openedTutorialDoor.current = true;
			newConfig = tutorialConfiguration;
		} else if (!openedTutorialDoor.current) {
			const objIndex = Math.min(doneObjectives, objectivePoses.length - 1);
			newConfig = objectivePoses[objIndex];
		}

		if (newConfig) {
			setLastValidConfig(newConfig);
		}
	}, [
		playerPositionRoom,
		tutorialDoor,
		doneObjectives,
		objectivePoses,
		tutorialConfiguration,
	]);

	useEffect(() => {
		if (mannequinHidden !== undefined) {
			setLastValidConfig(tutorialConfiguration);
		}
	}, [mannequinHidden, tutorialConfiguration]);

	useEffect(() => {
		if (isLoading || !actions) return;

		playAnimation(lastValidConfig.animation);

		const timer = setTimeout(() => {
			playAnimation(lastValidConfig.animation);

			const resetTimer = setTimeout(() => {
				playAnimation(lastValidConfig.animation);
			}, 3000);

			return () => clearTimeout(resetTimer);
		}, 2000);

		return () => clearTimeout(timer);
	}, [isLoading, actions, playAnimation, lastValidConfig]);

	return (
		<group
			ref={group}
			position={lastValidConfig.position}
			rotation={lastValidConfig.rotation}
			scale={lastValidConfig.scale}
			dispose={null}
		>
			{!isLoading && animations && (
				<Animations group={group} animations={animations} />
			)}
			<group name="Scene">
				<group name="mannequin">
					{visibleParts.hips && <primitive object={nodes.hips} />}
					{visibleParts.hips_L004 && <primitive object={nodes.hips_L004} />}
					{visibleParts.hips_R004 && <primitive object={nodes.hips_R004} />}
					{visibleParts.hips_L005 && <primitive object={nodes.hips_L005} />}
					{visibleParts.hips_R005 && <primitive object={nodes.hips_R005} />}
					{visibleParts.handL001 && <primitive object={nodes.handL001} />}
					{visibleParts.handR001 && <primitive object={nodes.handR001} />}
					{visibleParts.upper_armL001 && (
						<primitive object={nodes.upper_armL001} />
					)}
					{visibleParts.upper_armR001 && (
						<primitive object={nodes.upper_armR001} />
					)}
				</group>
			</group>
		</group>
	);
}

useGLTF.preload('/models/wooden_mannequin.glb');
