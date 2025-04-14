import { useEffect, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const resetAnimations = (actions) => {
	Object.values(actions).forEach((action) => {
		action.stop();
		action.reset();
		action.play();
		action.setEffectiveWeight(0);
		action.timeScale = 1;
	});
	if (actions['wave']) {
		actions['wave'].setEffectiveWeight(1);
	}
};

export default function Animations({ group, animations }) {
	const { actions } = useAnimations(animations, group);
	const previousAnimationRef = useRef('wave');

	useEffect(() => {
		if (actions) {
			resetAnimations(actions);
		}
	}, [actions]);

	useFrame((_, delta) => {
		if (!actions) return;

		const currentAnimation = group.current.userData.currentAnimation || 'wave';

		if (currentAnimation !== previousAnimationRef.current) {
			const fadeInAction = actions[currentAnimation];
			const fadeOutAction = actions[previousAnimationRef.current];

			if (fadeInAction && fadeOutAction) {
				const mixSpeed = 2.5;
				const weightDelta = mixSpeed * delta;

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

				Object.values(actions).forEach((action) => {
					if (
						action !== fadeInAction &&
						action !== fadeOutAction &&
						action.getEffectiveWeight() > 0
					) {
						action.setEffectiveWeight(0);
					}
				});

				if (fadeInWeight === 1 && fadeOutWeight === 0) {
					previousAnimationRef.current = currentAnimation;
				}
			}
		}
	});

	return null;
}
