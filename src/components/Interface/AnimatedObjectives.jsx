import React, {
	useRef,
	useLayoutEffect,
	useState,
	useEffect,
	forwardRef,
} from 'react';
import { gsap } from 'gsap';
import './AnimatedObjectives.css';

const AnimatedObjectives = forwardRef(
	({ onComplete, size = 'medium', animationKey, completed }, ref) => {
		const svgRef = useRef(null);
		const prevAnimationKeyRef = useRef(animationKey);

		useEffect(() => {
			if (ref && typeof ref === 'object' && 'current' in ref) {
				ref.current = svgRef.current;
			}
		}, [ref]);

		const timelineRef = useRef(null);
		const [hasPlayedDisappearAnimation, setHasPlayedDisappearAnimation] =
			useState(false);
		const prevCompletedRef = useRef(completed);

		useEffect(() => {
			if (completed && !prevCompletedRef.current) {
				setHasPlayedDisappearAnimation(false);
			}
			prevCompletedRef.current = completed;
		}, [completed]);

		useEffect(() => {
			if (prevAnimationKeyRef.current !== animationKey) {
				setHasPlayedDisappearAnimation(false);
				prevAnimationKeyRef.current = animationKey;
			}
		}, [animationKey]);

		useLayoutEffect(() => {
			if (completed && hasPlayedDisappearAnimation) {
				return;
			}

			if (timelineRef.current) {
				timelineRef.current.kill();
				timelineRef.current = null;
			}

			const svg = svgRef.current;
			if (!svg) return;

			const paths = Array.from(svg.querySelectorAll('path'));

			gsap.set(paths, {
				strokeDasharray: 1500,
				strokeDashoffset: completed ? 0 : 1500,
				opacity: 1,
			});

			const tl = gsap.timeline({
				onComplete: () => {
					if (onComplete && typeof onComplete === 'function') {
						onComplete();
					}
					if (completed) {
						setHasPlayedDisappearAnimation(true);
					}
				},
			});

			timelineRef.current = tl;

			const shuffledPaths = [...paths].sort(() => Math.random() - 0.5);
			const randomGroupCount = Math.floor(Math.random() * 2) + 3;
			const pathGroups = Array.from({ length: randomGroupCount }, () => []);

			shuffledPaths.forEach((path) => {
				const randomGroupIndex = Math.floor(Math.random() * randomGroupCount);
				pathGroups[randomGroupIndex].push(path);
			});

			const filteredGroups = pathGroups.filter((group) => group.length > 0);
			filteredGroups.sort(() => Math.random() - 0.5);

			if (completed) {
				filteredGroups.forEach((group, groupIndex) => {
					const groupDelay = groupIndex * 0.05;

					tl.to(
						group,
						{
							strokeDashoffset: 1500,
							duration: 0.8,
							stagger: {
								amount: 0.1,
								from: 'random',
							},
							ease: 'power2.inOut',
						},
						groupDelay
					);
				});
			} else {
				filteredGroups.forEach((group, groupIndex) => {
					const groupDelay = groupIndex * 0.1;

					tl.to(
						group,
						{
							strokeDashoffset: 0,
							duration: 1.2,
							stagger: {
								amount: 0.2,
								from: 'random',
							},
							ease: 'power2.inOut',
						},
						groupDelay
					);
				});
			}

			return () => {
				if (timelineRef.current) {
					timelineRef.current.kill();
					timelineRef.current = null;
				}
			};
		}, [animationKey, onComplete, completed, hasPlayedDisappearAnimation]);

		return (
			<svg
				ref={svgRef}
				className={`animated-objectives size-${size}`}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 55 45"
				data-animation-key={animationKey}
				data-completed={completed ? 'true' : 'false'}
			>
				<path
					strokeWidth={2}
					stroke="#efd89b"
					d="m 22.763383,22.290719 -5.523698,5.482373 -5.138003,-5.206877 5.151777,-5.193103 c 6.74782,6.597215 13.827904,13.63745 20.77241,20.496914 L 53.536302,22.304493 38.039643,6.7940602 Z"
				/>
				<path
					strokeWidth={2}
					stroke="#efd89b"
					d="m 32.046743,23.180984 6.195212,-5.823698 5.193229,5.190866 -5.163316,5.193635 C 31.266698,21.128579 24.147482,13.831094 17.077063,6.8263943 L 1.513512,22.349026 16.960179,37.857479 Z"
				/>
				<path
					strokeWidth={2}
					stroke="#efd89b"
					d="M 27.265625,33.375 32.4375,38.578125 27.28125,43.75 22.078125,38.53125 Z"
				/>
				<path
					strokeWidth={2}
					stroke="#efd89b"
					d="m 27.296875,11.765625 5.171875,-5.21875 -5.1875,-5.203125 -5.21875,5.25 z"
				/>
			</svg>
		);
	}
);

export default AnimatedObjectives;
