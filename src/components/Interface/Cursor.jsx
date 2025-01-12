import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaHandPaper } from 'react-icons/fa';
import { BiSolidDoorOpen } from 'react-icons/bi';
import { HiLightBulb } from 'react-icons/hi';
import { FaPowerOff } from 'react-icons/fa';
import { MdHearing } from 'react-icons/md';
import useInterface from '../../hooks/useInterface';
import './Interface.css';

const cursorIcons = {
	clean: <FaHandPaper />,
	door: <BiSolidDoorOpen />,
	light: <HiLightBulb />,
	power: <FaPowerOff />,
	listening: <MdHearing />,
};

export default function Cursor() {
	const cursor = useInterface((state) => state.cursor);
	const [progress, setProgress] = useState(0);
	const [isHolding, setIsHolding] = useState(false);
	const hasEmittedEvent = useRef(false);
	const isAnimating = useRef(false);
	const progressRef = useRef(0);

	const startHolding = useCallback(() => {
		setIsHolding(true);
		setProgress(0);
		progressRef.current = 0;
		hasEmittedEvent.current = false;
		isAnimating.current = true;
	}, []);

	const stopHolding = useCallback(() => {
		setIsHolding(false);
		setProgress(0);
		progressRef.current = 0;
		hasEmittedEvent.current = false;
		isAnimating.current = false;
	}, []);

	useEffect(() => {
		const handleMouseDown = () => {
			if (cursor === 'clean') {
				startHolding();
			}
		};

		const handleMouseUp = () => {
			stopHolding();
		};

		const handleStartProgress = () => {
			if (cursor === 'clean') {
				startHolding();
				// Démarrer l'animation qui dure environ 3 secondes
				setTimeout(() => {
					const event = new CustomEvent('progressComplete');
					document.dispatchEvent(event);
					stopHolding();
				}, 3000);
			}
		};

		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('startProgress', handleStartProgress);

		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('startProgress', handleStartProgress);
		};
	}, [cursor, startHolding, stopHolding]);

	useEffect(() => {
		let animationFrame;
		const animate = () => {
			if (isHolding && progressRef.current < 100 && isAnimating.current) {
				progressRef.current = Math.min(progressRef.current + 0.8, 100);
				setProgress(progressRef.current);

				if (progressRef.current === 100 && !hasEmittedEvent.current) {
					hasEmittedEvent.current = true;
					isAnimating.current = false;
					const event = new CustomEvent('progressComplete');
					document.dispatchEvent(event);
				}

				animationFrame = requestAnimationFrame(animate);
			}
		};

		if (isHolding && isAnimating.current) {
			animationFrame = requestAnimationFrame(animate);
		}

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, [isHolding]);

	const radius = 25;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	return (
		<div className={'cursor-container'}>
			{cursor && cursor !== 'hidden' ? (
				<div className="cursor-wrapper">
					{cursorIcons[cursor]}
					{isHolding && progress < 100 && (
						<svg
							className="progress-circle"
							width="100"
							height="100"
							viewBox="0 0 100 100"
						>
							<circle
								className="progress-circle-bg"
								cx="50"
								cy="50"
								r={radius}
								fill="none"
								strokeWidth="2"
							/>
							<circle
								className="progress-circle-fg"
								cx="50"
								cy="50"
								r={radius}
								fill="none"
								strokeWidth="2"
								style={{
									strokeDasharray: circumference,
									strokeDashoffset: strokeDashoffset,
								}}
							/>
						</svg>
					)}
				</div>
			) : (
				<div
					className={cursor === 'hidden' ? 'cursor-hidden' : 'simple-cursor'}
				/>
			)}
		</div>
	);
}
