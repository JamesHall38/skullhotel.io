import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useDoor from '../../hooks/useDoor';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import * as THREE from 'three';

const VOLUMES = {
	walk: 0.5,
	run: 0.8,
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
	// const footstepIndexRef = useRef(0);
	const creepingStateRef = useRef('playing'); // 'playing', 'paused', 'reversing', 'done'
	const creepingPauseTimeRef = useRef(0);

	const [monsterStepSounds, setMonsterStepSounds] = useState([]);
	const [soundsReady, setSoundsReady] = useState(false);

	const monsterState = useMonster((state) => state.monsterState);
	const animationMixSpeed = useMonster((state) => state.animationMixSpeed);
	const animationName = useMonster((state) => state.animationName);
	const animationSpeed = useMonster((state) => state.animationSpeed);
	const playAnimation = useMonster((state) => state.playAnimation);

	const isTposeRef = useRef(false);
	const lastAnimationTimeRef = useRef(0);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				const stepSounds = [
					getAudioInstance('monsterStep1'),
					getAudioInstance('monsterStep2'),
					getAudioInstance('monsterStep3'),
					getAudioInstance('monsterStep4'),
					getAudioInstance('monsterStep5'),
					getAudioInstance('monsterStep6'),
					getAudioInstance('monsterStep7'),
					getAudioInstance('monsterStep8'),
					getAudioInstance('monsterStep9'),
				];

				if (stepSounds.every((sound) => sound !== null)) {
					setMonsterStepSounds(stepSounds);
					setSoundsReady(true);
				} else {
					setTimeout(checkSounds, 100);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();
	}, []);

	useEffect(() => {
		if (actions) {
			resetAnimations(actions);
		}
	}, [actions]);

	useEffect(() => {
		if (!actions) return;

		if (monsterState === 'hiding') {
			resetAnimations(actions);
			creepingStateRef.current = 'playing';

			if (actions['Idle'] && previousAnimationRef.current !== 'Idle') {
				Object.values(actions).forEach((action) => {
					action.stop();
					action.setEffectiveWeight(0);
				});
				actions['Idle'].play();
				actions['Idle'].reset();
				actions['Idle'].setEffectiveWeight(1);
				previousAnimationRef.current = 'Idle';

				playAnimation('Idle');
			}
		}
	}, [actions, monsterState, playAnimation]);

	useEffect(() => {
		if (!actions) return;

		Object.values(actions).forEach((action) => {
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
		if (!actions || !actions[animationName]) return;

		if (animationName === 'Creeping') {
			Object.values(actions).forEach((action) => {
				action.stop();
				action.setEffectiveWeight(0);
			});

			const creepingAction = actions[animationName];
			creepingAction.play();
			creepingAction.setEffectiveWeight(1);
			creepingAction.reset();
			creepingAction.timeScale = 0.25;
			creepingStateRef.current = 'playing';
			previousAnimationRef.current = animationName;
			return;
		}

		if (previousAnimationRef.current === 'Creeping') {
			resetAnimations(actions);
			creepingStateRef.current = 'done';

			const newAction = actions[animationName];
			if (newAction) {
				newAction.play();
				newAction.setEffectiveWeight(1);
				newAction.reset();
				previousAnimationRef.current = animationName;
			}
			return;
		}

		if (animationName === 'Attack') {
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
			return;
		}

		if (animationName === 'Punch') {
			Object.values(actions).forEach((action) => {
				action.stop();
				action.setEffectiveWeight(0);
			});

			const punchAction = actions[animationName];
			punchAction.play();
			punchAction.setEffectiveWeight(1);
			punchAction.reset();
			punchAction.timeScale = 0.25;
			creepingStateRef.current = 'playing';
			previousAnimationRef.current = animationName;

			lastAnimationTimeRef.current = Date.now() / 1000;
			return;
		}

		if (previousAnimationRef.current === 'Punch') {
			resetAnimations(actions);
			creepingStateRef.current = 'done';
			isTposeRef.current = false;

			const newAction = actions[animationName];
			if (newAction) {
				newAction.play();
				newAction.setEffectiveWeight(1);
				newAction.reset();
			}
			previousAnimationRef.current = animationName;
			return;
		}

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
			if (!actions) return;

			if (animationName === 'Punch') {
				const fadeInAction = actions[animationName];
				Object.values(actions).forEach((action) => {
					if (action !== fadeInAction) {
						action.stop();
						action.setEffectiveWeight(0);
					}
				});

				fadeInAction.reset();
				fadeInAction.setEffectiveWeight(1);
				fadeInAction.play();
				previousAnimationRef.current = animationName;
				return;
			}

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
					}
				});
				if (fadeInWeight === 1 && fadeOutWeight === 0) {
					previousAnimationRef.current = animationName;
				}
			}
		},
		[actions, animationName, animationMixSpeed, monsterState]
	);

	useEffect(() => {
		let intervalId;

		if (
			soundsReady &&
			monsterStepSounds.length > 0 &&
			(animationName === 'Walk' ||
				animationName === 'Run' ||
				animationName === 'CeilingCrawl')
		) {
			const currentAnimation = animations.find(
				(anim) => anim.name === animationName
			);
			const animationDuration = currentAnimation
				? currentAnimation.duration * 450
				: 450;
			const stepInterval =
				animationDuration / (animationName === 'CeilingCrawl' ? 1 : 2);

			intervalId = setInterval(() => {
				const randomIndex = Math.floor(
					Math.random() * monsterStepSounds.length
				);
				const sound = monsterStepSounds[randomIndex];
				if (sound) {
					sound.volume = animationName === 'Run' ? VOLUMES.run : VOLUMES.walk;

					if (!sound.paused) {
						sound.currentTime = 0;
					}
					sound.play().catch(() => {});
				}
			}, stepInterval);
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [animationName, animations, monsterStepSounds, soundsReady]);

	useEffect(() => {
		if (animationName === 'Attack' && actions && actions['Attack']) {
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

	useFrame((_, delta) => {
		if (!group.current || !actions) return;

		animationMixTransition(delta);

		if (animationName === 'Creeping' && animationName !== 'Attack') {
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

	useEffect(() => {
		if (monsterState === 'hiding') {
			resetAnimations(actions);

			creepingStateRef.current = 'playing';
			previousAnimationRef.current = 'Idle';

			if (actions['Idle']) {
				actions['Idle'].reset();
				actions['Idle'].setEffectiveWeight(1);
				actions['Idle'].play();
			}
		}
	}, [actions, monsterState]);

	return null;
}
