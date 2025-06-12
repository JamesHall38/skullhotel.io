import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from 'react';
import { FaHandPaper } from 'react-icons/fa';
import { BiSolidDoorOpen } from 'react-icons/bi';
import { HiLightBulb } from 'react-icons/hi';
import { FaPowerOff } from 'react-icons/fa';
import { FaBook } from 'react-icons/fa6';
import { IoInformationCircle } from 'react-icons/io5';
import useInterface from '../../hooks/useInterface';
import useGame from '../../hooks/useGame';
import './Interface.css';

const cursorIcons = {
	clean: (
		<div className="cursor-icon cursor-icon-clean">
			<FaHandPaper />
		</div>
	),
	door: (
		<div className="cursor-icon cursor-icon-door">
			<BiSolidDoorOpen />
		</div>
	),
	light: (
		<div className="cursor-icon cursor-icon-light">
			<HiLightBulb />
		</div>
	),
	power: (
		<div className="cursor-icon cursor-icon-power">
			<FaPowerOff />
		</div>
	),
	listening: (
		<div className="cursor-icon cursor-icon-listening">
			<svg
				stroke="currentColor"
				fill="currentColor"
				strokeWidth="0"
				viewBox="0 0 24 24"
				height="1em"
				width="1em"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55A3.999 3.999 0 0 0 21 18h-2c0 1.1-.9 2-2 2zM7.64 2.64 6.22 1.22C4.23 3.21 3 5.96 3 9s1.23 5.79 3.22 7.78l1.41-1.41C6.01 13.74 5 11.49 5 9s1.01-4.74 2.64-6.36zM11.5 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0-5 0z" />
			</svg>
		</div>
	),
	book: (
		<div className="cursor-icon cursor-icon-book">
			<FaBook />
		</div>
	),
	help: (
		<div className="cursor-icon cursor-icon-help">
			<IoInformationCircle />
		</div>
	),
};

export default function Cursor() {
	const cursor = useInterface((state) => state.cursor);
	const isEndAnimationPlaying = useGame((state) => state.isEndAnimationPlaying);
	const [progress, setProgress] = useState(0);
	const [isHolding, setIsHolding] = useState(false);
	const hasEmittedEvent = useRef(false);
	const isAnimating = useRef(false);
	const progressRef = useRef(0);
	const lastFrameTimeRef = useRef(performance.now());
	const isProgressInProgress = useRef(false);

	const cursorFirstPart = useMemo(() => {
		return cursor ? cursor.split('-')[0] : null;
	}, [cursor]);

	const startHolding = useCallback((emitEvent = false) => {
		if (isProgressInProgress.current) return;

		setIsHolding(true);
		setProgress(0);
		progressRef.current = 0;
		hasEmittedEvent.current = false;
		isAnimating.current = true;
		lastFrameTimeRef.current = performance.now();
		isProgressInProgress.current = true;

		if (emitEvent) {
			const startEvent = new CustomEvent('startProgress');
			document.dispatchEvent(startEvent);
		}
	}, []);

	const stopHolding = useCallback(() => {
		setIsHolding(false);
		setProgress(0);
		progressRef.current = 0;
		hasEmittedEvent.current = false;
		isAnimating.current = false;
		isProgressInProgress.current = false;
	}, []);

	useEffect(() => {
		const handleMouseDown = (e) => {
			if (e.button === 0 && cursorFirstPart === 'clean') {
				startHolding(true);
			}
		};

		const handleMouseUp = (e) => {
			if (e.button === 0) {
				stopHolding();
			}
		};

		const handleStartProgress = () => {
			if (cursorFirstPart === 'clean' && !isProgressInProgress.current) {
				startHolding(false);

				setTimeout(() => {
					const event = new CustomEvent('progressComplete');
					document.dispatchEvent(event);
					stopHolding();
				}, 1500);
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
	}, [cursorFirstPart, startHolding, stopHolding]);

	useEffect(() => {
		let animationFrame;
		const animate = () => {
			if (isHolding && progressRef.current < 100 && isAnimating.current) {
				const currentTime = performance.now();
				const deltaTime = currentTime - lastFrameTimeRef.current;
				progressRef.current = Math.min(
					progressRef.current + deltaTime * 0.067,
					100
				);
				setProgress(progressRef.current);

				if (progressRef.current >= 100 && !hasEmittedEvent.current) {
					hasEmittedEvent.current = true;
					isAnimating.current = false;
					isProgressInProgress.current = false;
					const event = new CustomEvent('progressComplete');
					document.dispatchEvent(event);
				}

				lastFrameTimeRef.current = currentTime;
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

	if (isEndAnimationPlaying) {
		return null;
	}

	return (
		<div className={'cursor-container'}>
			{cursorFirstPart && cursorFirstPart !== 'hidden' ? (
				<div className="cursor-wrapper">
					{cursorIcons[cursorFirstPart]}
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
					className={
						cursorFirstPart === 'hidden' ? 'cursor-hidden' : 'simple-cursor'
					}
				/>
			)}
		</div>
	);
}
