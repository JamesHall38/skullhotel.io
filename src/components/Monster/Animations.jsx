import { useCallback, useEffect, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useMonster from '../../hooks/useMonster';

export default function Animations({ group, animations }) {
	const { actions } = useAnimations(animations, group);
	const previousAnimationRef = useRef('Idle');

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

	useFrame((_, delta) => {
		if (!group.current) return;
		animationMixTransition(delta);
	});

	return null;
}