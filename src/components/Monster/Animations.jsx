import { useCallback, useEffect, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
// import useLight from '../../hooks/useLight';
import { getAudioInstance } from '../../utils/audio';
import * as THREE from 'three';

const monsterStepSounds = [
	getAudioInstance('monsterStep1'),
	getAudioInstance('monsterStep2'),
	getAudioInstance('monsterStep3'),
	getAudioInstance('monsterStep4'),
];

const VOLUMES = {
	walk: 0.5,
	run: 1,
};

const PAUSE_DURATION = 1;

const WALK_ANIMATION_SPEED_FACTOR = 0.5;

const resetAnimations = (actions) => {
	Object.values(actions).forEach((action) => {
		action.stop();
		action.reset();
		action.play();
		action.setEffectiveWeight(0);
		action.timeScale = 1;
	});
	if (actions['Idle']) {
		actions['Idle'].setEffectiveWeight(1);
	}
};

function resetGame() {
	const game = useGame.getState();
	game.restart();
	game.setJumpScare(false);
	useInterface.getState().restart();
	useDoor.getState().restart();
	useMonster.getState().restart();
}

export default function Animations({ group, animations }) {
	const { actions } = useAnimations(animations, group);
	const previousAnimationRef = useRef('Idle');
	const setOpenDeathScreen = useGame((state) => state.setOpenDeathScreen);
	const footstepIndexRef = useRef(0);
	const creepingStateRef = useRef('playing'); // 'playing', 'paused', 'reversing', 'done'
	const creepingPauseTimeRef = useRef(0);

	const monsterState = useMonster((state) => state.monsterState);
	const animationMixSpeed = useMonster((state) => state.animationMixSpeed);
	const animationName = useMonster((state) => state.animationName);
	const animationSpeed = useMonster((state) => state.animationSpeed);

	// const setIsRedLight = useLight((state) => state.setIsRedLight);

	useEffect(() => {
		resetAnimations(actions);
	}, [actions]);

	useEffect(() => {
		Object.values(actions).forEach((action) => {
			// Apply specific speed factor for Walk animation
			if (
				action._clip.name === 'Walk' ||
				action._clip.name === 'CeilingCrawl'
			) {
				action.timeScale = animationSpeed * WALK_ANIMATION_SPEED_FACTOR;
			} else {
				action.timeScale = animationSpeed;
			}
		});
	}, [actions, animationSpeed]);

	useEffect(() => {
		if (animationName === 'Creeping') {
			Object.values(actions).forEach((action) => {
				action.stop();
			});
			const creepingAction = actions[animationName];
			creepingAction.play();
			creepingAction.setEffectiveWeight(1);
			creepingAction.reset();
			creepingAction.timeScale = 0.25;
			creepingStateRef.current = 'playing';
			previousAnimationRef.current = animationName;
			return;
		} else if (
			previousAnimationRef.current === 'Creeping' &&
			animationName === 'Run'
		) {
			Object.values(actions).forEach((action) => {
				action.stop();
			});

			const runAction = actions['Run'];
			runAction.play();
			runAction.setEffectiveWeight(1);
			runAction.reset();
			runAction.timeScale = 1;

			previousAnimationRef.current = 'Run';
			creepingStateRef.current = 'done';
		} else if (animationName === 'Attack') {
			Object.values(actions).forEach((action) => {
				action.stop();
				action.setEffectiveWeight(0);
			});

			const attackAction = actions['Attack'];
			attackAction.play();
			attackAction.setEffectiveWeight(1);
			attackAction.reset();
			attackAction.timeScale = 1;

			previousAnimationRef.current = 'Attack';
		} else if (animationName === previousAnimationRef.current) {
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
			if (
				((animationName === 'Creeping' ||
					previousAnimationRef.current === 'Creeping') &&
					animationName !== 'Run') ||
				animationName === 'Attack'
			) {
				return;
			}

			const fadeInAction = actions[animationName];
			const fadeOutAction = actions[previousAnimationRef.current];

			if (
				previousAnimationRef.current !== animationName &&
				fadeInAction &&
				fadeOutAction &&
				animationName !== 'Creeping' &&
				previousAnimationRef.current !== 'Creeping'
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

		if (
			animationName === 'Walk' ||
			animationName === 'Run' ||
			animationName === 'CeilingCrawl'
		) {
			const currentAnimation = animations.find(
				(anim) => anim.name === animationName
			);
			const animationDuration = currentAnimation
				? currentAnimation.duration * 1000
				: 1000;
			const stepInterval = animationDuration / 2;

			intervalId = setInterval(() => {
				const sound = monsterStepSounds[footstepIndexRef.current];
				if (sound) {
					sound.volume = animationName === 'Run' ? VOLUMES.run : VOLUMES.walk;

					if (!sound.paused) {
						sound.currentTime = 0;
					}
					sound.play().catch(() => {});

					footstepIndexRef.current =
						(footstepIndexRef.current + 1) % monsterStepSounds.length;
				}
			}, stepInterval);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [animationName, animations]);

	useEffect(() => {
		if (animationName === 'Attack' && actions['Attack']) {
			const attackAction = actions['Attack'];

			const onAttackFinished = () => {
				setOpenDeathScreen(true);
				resetAnimations(actions);
				resetGame();
			};

			attackAction.getMixer().addEventListener('finished', onAttackFinished);

			attackAction.setLoop(THREE.LoopOnce);
			attackAction.clampWhenFinished = true;

			return () => {
				attackAction
					.getMixer()
					.removeEventListener('finished', onAttackFinished);
			};
		}
	}, [animationName, actions, setOpenDeathScreen]);

	// useEffect(() => {
	// 	if (animationName === 'Creeping' && monsterState === 'leaving') {
	// 		setIsRedLight(true);
	// 	} else {
	// 		setIsRedLight(false);
	// 	}
	// }, [animationName, monsterState, setIsRedLight]);

	useFrame((_, delta) => {
		if (!group.current) return;
		animationMixTransition(delta);

		if (animationName !== 'Attack' && animationName === 'Creeping') {
			const creepingAction = actions['Creeping'];
			if (!creepingAction) return;

			switch (creepingStateRef.current) {
				case 'playing':
					if (creepingAction.time >= creepingAction._clip.duration - 0.01) {
						creepingStateRef.current = 'paused';
						creepingPauseTimeRef.current = 0;
						creepingAction.paused = true;
					}
					break;

				case 'paused':
					creepingPauseTimeRef.current += delta;
					if (creepingPauseTimeRef.current >= PAUSE_DURATION) {
						creepingStateRef.current = 'reversing';
						creepingAction.paused = false;
						creepingAction.timeScale = -1;
					}
					break;

				case 'reversing':
					if (creepingAction.time <= 0.01) {
						creepingStateRef.current = 'done';
						creepingAction.paused = true;
						previousAnimationRef.current = 'Idle';
					}
					break;
			}
		}
	});

	return null;
}
