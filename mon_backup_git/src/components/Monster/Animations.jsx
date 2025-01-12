import { useCallback, useEffect, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';

const monsterStepSounds = [
	new Audio('/sounds/monster_step1.ogg'),
	new Audio('/sounds/monster_step2.ogg'),
	new Audio('/sounds/monster_step3.ogg'),
	new Audio('/sounds/monster_step4.ogg'),
];

monsterStepSounds.forEach((sound) => {
	sound.preload = 'auto';
});

const VOLUMES = {
	walk: 0.5,
	run: 1,
};

function resetGame() {
	useGame.getState().restart();
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
}

export default function Animations({ group, animations }) {
	const { actions } = useAnimations(animations, group);
	const previousAnimationRef = useRef('Idle');
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const footstepIndexRef = useRef(0);

	const monsterState = useMonster((state) => state.monsterState);
	const animationMixSpeed = useMonster((state) => state.animationMixSpeed);
	const animationName = useMonster((state) => state.animationName);
	const animationSpeed = useMonster((state) => state.animationSpeed);

	useEffect(() => {
		Object.values(actions).forEach((action) => {
			action.play();
		});
	}, [actions]);

	useEffect(() => {
		Object.values(actions).forEach((action) => {
			action.timeScale = animationSpeed;
		});
	}, [actions, animationSpeed]);

	useEffect(() => {
		if (animationName === previousAnimationRef.current) {
			Object.values(actions).forEach((action) => {
				action.setEffectiveWeight(0);
				if (action._clip.name === animationName) {
					action.setEffectiveWeight(1);
				}
			});
		}
		if (animationName === 'Idle') {
			actions[animationName].reset();
		}
		if (animationName === 'Attack') {
			actions[animationName].reset();
			actions[animationName].timeScale = 1;
		}
	}, [actions, animationName]);

	const animationMixTransition = useCallback(
		(delta) => {
			const fadeInAction = actions[animationName];
			const fadeOutAction = actions[previousAnimationRef.current];

			if (
				previousAnimationRef.current !== animationName &&
				fadeInAction &&
				fadeOutAction
			) {
				const weightDelta = animationMixSpeed * delta;
				const fadeInWeight = Math.min(
					fadeInAction.getEffectiveWeight() + weightDelta,
					1
				);
				const fadeOutWeight = Math.max(
					fadeOutAction.getEffectiveWeight() - weightDelta,
					0
				);
				fadeInAction.setEffectiveWeight(fadeInWeight);
				fadeOutAction.setEffectiveWeight(fadeOutWeight);

				if (monsterState === 'hidden') {
					fadeInAction.setEffectiveWeight(1);
					fadeOutAction.setEffectiveWeight(0);
				}

				Object.values(actions).forEach((action) => {
					if (
						action !== fadeInAction &&
						action !== fadeOutAction &&
						action.getEffectiveWeight() > 0
					) {
						action.setEffectiveWeight(0);
						actions[previousAnimationRef.current].setEffectiveWeight(1);
					}
				});
				if (fadeInWeight === 1 && fadeOutWeight === 0) {
					previousAnimationRef.current = animationName;
				}
			}
		},
		[
			actions,
			animationName,
			previousAnimationRef,
			animationMixSpeed,
			monsterState,
		]
	);

	useEffect(() => {
		let intervalId;

		if (animationName === 'Walk' || animationName === 'Run') {
			const currentAnimation = animations.find(
				(anim) => anim.name === animationName
			);
			const animationDuration = currentAnimation
				? currentAnimation.duration * 1000
				: 1000;
			const stepInterval = animationDuration / 2;

			intervalId = setInterval(() => {
				const sound = monsterStepSounds[footstepIndexRef.current];
				sound.volume = animationName === 'Run' ? VOLUMES.run : VOLUMES.walk;

				if (!sound.paused) {
					sound.currentTime = 0;
				}
				sound.play().catch(() => {});

				footstepIndexRef.current =
					(footstepIndexRef.current + 1) % monsterStepSounds.length;
			}, stepInterval);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [animationName, animations]);

	useFrame((_, delta) => {
		if (!group.current) return;
		animationMixTransition(delta);

		if (animationName === 'Attack') {
			const attackAction = actions['Attack'];
			if (
				attackAction &&
				attackAction.time >= attackAction._clip.duration - 0.01
			) {
				setOpenDeathScreen(true);
				resetGame();
			}
		}
	});

	return null;
}
