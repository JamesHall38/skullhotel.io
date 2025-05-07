import { useEffect, useRef, useState } from 'react';
import PopupWrapper from '../PopupWrapper/PopupWrapper';
import AnimatedCloseButton from '../AnimatedCloseButton/AnimatedCloseButton';
import { RxExternalLink } from 'react-icons/rx';
import { SiThreedotjs } from 'react-icons/si';
import useGame from '../../../hooks/useGame';
import './HowItsMade.css';
import LogoIcon from './logo.svg';
import R3FIcon from './r3f-icon.svg';
import ThreeJSJourneyIcon from './threejs-journey-icon.svg';

function HowItsMadeContent({ onClose }) {
	const contentRef = useRef(null);
	const [focusableElements, setFocusableElements] = useState([]);
	const [currentFocus, setCurrentFocus] = useState(-1);
	const deviceMode = useGame((state) => state.deviceMode);
	const lastNavigationTime = useRef(0);
	const linkClickedRef = useRef(false);
	const lastAButtonState = useRef(false);

	useEffect(() => {
		if (contentRef.current && deviceMode === 'gamepad') {
			const allInteractiveElements = contentRef.current.querySelectorAll(
				'a, button, [role="button"]'
			);
			allInteractiveElements.forEach((element) => {
				if (!element.classList.contains('close-button')) {
					element.setAttribute('data-gamepad-skip', 'true');
					element.style.pointerEvents = 'none';
				}
			});

			const closeButton = contentRef.current.querySelector('.close-button');
			if (closeButton) {
				setFocusableElements([closeButton]);
				setCurrentFocus(0);
				closeButton.classList.add('gamepad-focus');
			}
		}
	}, [deviceMode]);

	useEffect(() => {
		if (currentFocus >= 0 && currentFocus < focusableElements.length) {
			focusableElements.forEach((element) => {
				element.classList.remove('gamepad-focus');
			});
			focusableElements[currentFocus].classList.add('gamepad-focus');
		}
	}, [currentFocus, focusableElements]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const handleGamepadNavigation = () => {
			const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
			let gamepad = null;

			for (const gp of gamepads) {
				if (gp && gp.connected) {
					gamepad = gp;
					break;
				}
			}

			if (!gamepad) return;

			const now = Date.now();
			if (now - lastNavigationTime.current < 200) {
				return;
			}

			const closeButton = contentRef.current?.querySelector('.close-button');
			if (closeButton) {
				setFocusableElements([closeButton]);
				setCurrentFocus(0);
				closeButton.classList.add('gamepad-focus');
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;

			if (
				aButtonPressed &&
				!lastAButtonState.current &&
				!linkClickedRef.current
			) {
				if (currentFocus >= 0 && currentFocus < focusableElements.length) {
					const focusedEl = focusableElements[currentFocus];
					if (
						focusedEl.tagName === 'BUTTON' &&
						focusedEl.classList.contains('close-button')
					) {
						focusedEl.click();
					}
					lastNavigationTime.current = now;
				}
			}

			lastAButtonState.current = aButtonPressed;

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed) {
				onClose();
				lastNavigationTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadNavigation, 16); // ~60fps
		return () => clearInterval(interval);
	}, [deviceMode, currentFocus, focusableElements, onClose]);

	return (
		<div className="how-its-made-content" ref={contentRef}>
			<div className="how-its-made-header">
				<div className="how-its-made-header-col">
					<img src={LogoIcon} alt="Logo" />
					<h2>How it&apos;s made</h2>
				</div>

				<div className="close-container">
					<AnimatedCloseButton onClick={onClose} size={1} />
				</div>
			</div>

			<div className="tech-container-content-row">
				<div className="tech-container">
					<h2>TECHNOLOGIES</h2>

					<div className="tech-item">
						<div className="tech-icon">
							<SiThreedotjs />
						</div>
						<div className="tech-description">
							<h3 onClick={() => window.open('https://threejs.org/', '_blank')}>
								<a
									href="https://threejs.org/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Three.js
								</a>
								<p
									onClick={() => window.open('https://threejs.org/', '_blank')}
								>
									A JavaScript library for creating 3D graphics in the browser
								</p>
								<RxExternalLink className="external-link-icon" />
							</h3>
							<p
								className="tech-author"
								onClick={() =>
									window.open('https://github.com/mrdoob', '_blank')
								}
							>
								Created by{' '}
								<a
									href="https://github.com/mrdoob"
									target="_blank"
									rel="noopener noreferrer"
								>
									mrdoob
								</a>
								<RxExternalLink className="external-link-icon" />
							</p>
						</div>
					</div>

					<div className="tech-item">
						<div className="tech-icon">
							<img
								src={R3FIcon}
								alt="React Three Fiber"
								width="38"
								height="38"
							/>
						</div>
						<div className="tech-description">
							<h3
								onClick={() =>
									window.open('https://r3f.docs.pmnd.rs/', '_blank')
								}
							>
								<a
									href="https://r3f.docs.pmnd.rs/"
									target="_blank"
									rel="noopener noreferrer"
								>
									React Three Fiber
								</a>
								<p
									onClick={() =>
										window.open('https://r3f.docs.pmnd.rs/', '_blank')
									}
								>
									A tool that makes it easier to use three.js with React
								</p>
								<RxExternalLink className="external-link-icon" />
							</h3>

							<p
								className="tech-author"
								onClick={() =>
									window.open('https://github.com/pmndrs', '_blank')
								}
							>
								Created by{' '}
								<a
									href="https://github.com/pmndrs"
									target="_blank"
									rel="noopener noreferrer"
								>
									Poimandres
								</a>
								<RxExternalLink className="external-link-icon" />
							</p>
						</div>
					</div>

					<div className="tech-item">
						<div className="tech-icon">
							<img
								src={ThreeJSJourneyIcon}
								alt="Three.js Journey"
								width="38"
								height="38"
							/>
						</div>
						<div className="tech-description">
							<h3
								onClick={() =>
									window.open('https://threejs-journey.com/', '_blank')
								}
							>
								<a
									href="https://threejs-journey.com/"
									target="_blank"
									rel="noopener noreferrer"
								>
									Three.js Journey
								</a>
								<p
									onClick={() =>
										window.open('https://threejs-journey.com/', '_blank')
									}
								>
									An online course to learn 3D for the web
								</p>
								<RxExternalLink className="external-link-icon" />
							</h3>

							<p
								className="tech-author"
								onClick={() =>
									window.open('https://github.com/brunosimon', '_blank')
								}
							>
								Created by{' '}
								<a
									href="https://github.com/brunosimon"
									target="_blank"
									rel="noopener noreferrer"
								>
									Bruno Simon
								</a>
								<RxExternalLink className="external-link-icon" />
							</p>
						</div>
					</div>
				</div>

				<div className="tech-container">
					<h2>PEOPLE</h2>
					<div className="tech-description">
						<h3
							onClick={() =>
								window.open('https://github.com/JamesHall38', '_blank')
							}
						>
							<a
								href="https://github.com/JamesHall38"
								target="_blank"
								rel="noopener noreferrer"
							>
								Game concept, game design & game development
							</a>
							<p
								className="tech-author"
								onClick={() =>
									window.open('https://github.com/JamesHall38', '_blank')
								}
							>
								<a
									href="https://github.com/JamesHall38"
									target="_blank"
									rel="noopener noreferrer"
								>
									James Hall
								</a>
							</p>
							<div className="external-link-icon-container">
								<RxExternalLink className="external-link-icon" />
							</div>
						</h3>
					</div>
					<div className="tech-description">
						<h3
							onClick={() =>
								window.open(
									'https://www.linkedin.com/in/lucas-houbre',
									'_blank'
								)
							}
						>
							<a
								href="https://www.linkedin.com/in/lucas-houbre"
								target="_blank"
								rel="noopener noreferrer"
							>
								User interface & Art direction
							</a>
							<p
								className="tech-author"
								onClick={() =>
									window.open(
										'https://www.linkedin.com/in/lucas-houbre',
										'_blank'
									)
								}
							>
								<a
									href="https://www.linkedin.com/in/lucas-houbre"
									target="_blank"
									rel="noopener noreferrer"
								>
									Lucas Houbre
								</a>
							</p>
							<div className="external-link-icon-container">
								<RxExternalLink className="external-link-icon" />
							</div>
						</h3>
					</div>
					<div className="footer-note">
						<p>
							This is an open source project. Check out the{' '}
							<a
								href="https://github.com/JamesHall38/skullhotel.io"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub repository
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function HowItsMade() {
	return (
		<PopupWrapper cursorType="help">
			<HowItsMadeContent />
		</PopupWrapper>
	);
}
