<<<<<<< Updated upstream
import React from 'react';
import { ReactComponent as BellIcon } from './cursors/bell.svg';
import { ReactComponent as CleanIcon } from './cursors/clean.svg';
import { ReactComponent as DoorIcon } from './cursors/door.svg';
import { ReactComponent as HelpIcon } from './cursors/help.svg';
import { ReactComponent as LightIcon } from './cursors/light.svg';
import { ReactComponent as PowerIcon } from './cursors/power.svg';
import useInterface from '../../hooks/useInterface';
import './Interface.css';

=======
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

>>>>>>> Stashed changes
export default function Cursor() {
	const cursor = useInterface((state) => state.cursor);

<<<<<<< Updated upstream
	const cursorIcons = {
		bell: <BellIcon />,
		clean: <CleanIcon />,
		door: <DoorIcon />,
		help: <HelpIcon className="help-cursor" />,
		light: <LightIcon />,
		power: <PowerIcon />,
	};
=======
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
>>>>>>> Stashed changes

	return (
		<div className={'cursor-container'}>
			{cursor ? cursorIcons[cursor] : <div className="simple-cursor" />}
		</div>
	);
}
