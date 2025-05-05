import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './AnimatedCloseButton.css';

const AnimatedCloseSegment = ({ size, isHovered = false }) => {
	const svgRef = useRef(null);
	const path1Ref = useRef(null);
	const path2Ref = useRef(null);
	const timeline = useRef(null);

	useGSAP(() => {
		if (!path1Ref.current || !path2Ref.current) return;

		const path1Length = path1Ref.current.getTotalLength();
		const path2Length = path2Ref.current.getTotalLength();

		gsap.set([path1Ref.current, path2Ref.current], {
			strokeDasharray: function (i) {
				return i === 0 ? path1Length : path2Length;
			},
		});

		gsap.set(path1Ref.current, {
			opacity: 0,
			strokeDashoffset: path1Length - 1,
		});

		gsap.set(path2Ref.current, {
			opacity: 1,
			strokeDashoffset: 0,
		});

		timeline.current = gsap.timeline({
			paused: true,
			smoothChildTiming: true,
		});

		timeline.current
			.to(path2Ref.current, {
				strokeDashoffset: path2Length - 1,
				duration: 0.2,
				ease: 'power2.inOut',
			})

			.set(path2Ref.current, { opacity: 0 })
			.set(path1Ref.current, { opacity: 1 })

			.to(
				path1Ref.current,
				{
					strokeDashoffset: 0,
					duration: 0.55,
					ease: 'power2.inOut',
					startAt: {
						strokeDashoffset: path1Length - 1,
					},
				},
				'-=0.15'
			);
	}, []);

	useEffect(() => {
		if (!timeline.current) return;

		if (isHovered) {
			timeline.current.play();
		} else {
			timeline.current.reverse();
		}
	}, [isHovered]);

	return (
		<svg
			ref={svgRef}
			viewBox="0 0 20 20"
			width={size}
			height={size}
			xmlns="http://www.w3.org/2000/svg"
			data-gamepad-skip="true"
		>
			<path
				data-gamepad-skip="true"
				ref={path1Ref}
				d="M 6.121994,6.1182665 9.168333,9.1804093 12.222819,6.1398637 15.023398,8.8772281"
				className="animated-path"
			/>
			<path
				data-gamepad-skip="true"
				ref={path2Ref}
				d="M 6.121994,6.1182665 9.168333,9.1804093 11.921431,11.942545"
				className="animated-path"
			/>
			<path
				data-gamepad-skip="true"
				d="M 1.3711203,1.3673928 6.121994,6.1182665"
				className="animated-path"
			/>
		</svg>
	);
};

const AnimatedCloseButton = ({ onClick, size = 6 }) => {
	const [isHovered, setIsHovered] = useState(false);
	const containerRef = useRef(null);

	const handleMouseEnter = () => setIsHovered(true);
	const handleMouseLeave = () => setIsHovered(false);

	useEffect(() => {
		if (!containerRef.current) return;

		const checkForFocus = () => {
			const hasFocus = containerRef.current.classList.contains('gamepad-focus');
			setIsHovered(hasFocus);
		};

		const observer = new MutationObserver(checkForFocus);
		observer.observe(containerRef.current, {
			attributes: true,
			attributeFilter: ['class'],
		});

		checkForFocus();

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="close-button"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClick={onClick}
			style={{ width: `${size * 2}rem`, height: `${size * 2}rem` }}
			role="button"
			tabIndex="0"
			aria-label="Close"
		>
			<div
				className={`stacked-segments ${isHovered ? 'hovered' : ''}`}
				data-gamepad-skip="true"
			>
				<div
					className="segment"
					style={{
						transform: `rotate(0deg) translate(-${size / 9}rem, -${
							size / 9
						}rem)`,
					}}
					data-gamepad-skip="true"
				>
					<AnimatedCloseSegment size={`${size}rem`} isHovered={isHovered} />
				</div>
				<div
					className="segment"
					style={{
						transform: `rotate(90deg) translate(-${size / 9}rem, -${
							size / 9
						}rem)`,
					}}
					data-gamepad-skip="true"
				>
					<AnimatedCloseSegment size={`${size}rem`} isHovered={isHovered} />
				</div>
				<div
					className="segment"
					style={{
						transform: `rotate(180deg) translate(-${size / 9}rem, -${
							size / 9
						}rem)`,
					}}
					data-gamepad-skip="true"
				>
					<AnimatedCloseSegment size={`${size}rem`} isHovered={isHovered} />
				</div>
				<div
					className="segment"
					style={{
						transform: `rotate(270deg) translate(-${size / 9}rem, -${
							size / 9
						}rem)`,
					}}
					data-gamepad-skip="true"
				>
					<AnimatedCloseSegment size={`${size}rem`} isHovered={isHovered} />
				</div>
			</div>
		</div>
	);
};

export default AnimatedCloseButton;
