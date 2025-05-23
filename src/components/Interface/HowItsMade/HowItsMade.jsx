import { useEffect, useRef, useState } from 'react';
import PopupWrapper from '../PopupWrapper/PopupWrapper';
import AnimatedCloseButton from '../AnimatedCloseButton/AnimatedCloseButton';
import { RxExternalLink } from 'react-icons/rx';
import { SiThreedotjs } from 'react-icons/si';
import useGame from '../../../hooks/useGame';
import { isSteamBuild } from '../../../utils/platform';
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
	const isInSteamBuild = isSteamBuild();

	const handleLinkClick = (e, url) => {
		if (isInSteamBuild) {
			e.preventDefault();
			return false;
		}
		window.open(url, '_blank');
	};

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
					<div className="footer-note">
						<p>
							This is an open source project. Check out the{' '}
							<a
								href={
									isInSteamBuild
										? '#'
										: 'https://github.com/JamesHall38/skullhotel.io'
								}
								target={isInSteamBuild ? '_self' : '_blank'}
								rel="noopener noreferrer"
								onClick={(e) => isInSteamBuild && e.preventDefault()}
								style={
									isInSteamBuild
										? { cursor: 'default', textDecoration: 'none' }
										: {}
								}
							>
								GitHub repository
							</a>
						</p>
					</div>
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
							<h3 onClick={(e) => handleLinkClick(e, 'https://threejs.org/')}>
								<a
									href={isInSteamBuild ? '#' : 'https://threejs.org/'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									Three.js
								</a>
								<p onClick={(e) => handleLinkClick(e, 'https://threejs.org/')}>
									A JavaScript library for creating 3D graphics in the browser
								</p>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</h3>
							<p
								className="tech-author"
								onClick={(e) => handleLinkClick(e, 'https://github.com/mrdoob')}
							>
								Created by{' '}
								<a
									href={isInSteamBuild ? '#' : 'https://github.com/mrdoob'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									mrdoob
								</a>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
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
								onClick={(e) => handleLinkClick(e, 'https://r3f.docs.pmnd.rs/')}
							>
								<a
									href={isInSteamBuild ? '#' : 'https://r3f.docs.pmnd.rs/'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									React Three Fiber
								</a>
								<p
									onClick={(e) =>
										handleLinkClick(e, 'https://r3f.docs.pmnd.rs/')
									}
								>
									A tool that makes it easier to use three.js with React
								</p>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</h3>

							<p
								className="tech-author"
								onClick={(e) => handleLinkClick(e, 'https://github.com/pmndrs')}
							>
								Created by{' '}
								<a
									href={isInSteamBuild ? '#' : 'https://github.com/pmndrs'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									Poimandres
								</a>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
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
								onClick={(e) =>
									handleLinkClick(e, 'https://threejs-journey.com/')
								}
							>
								<a
									href={isInSteamBuild ? '#' : 'https://threejs-journey.com/'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									Three.js Journey
								</a>
								<p
									onClick={(e) =>
										handleLinkClick(e, 'https://threejs-journey.com/')
									}
								>
									An online course to learn 3D for the web
								</p>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</h3>

							<p
								className="tech-author"
								onClick={(e) =>
									handleLinkClick(e, 'https://github.com/brunosimon')
								}
							>
								Created by{' '}
								<a
									href={isInSteamBuild ? '#' : 'https://github.com/brunosimon'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									Bruno Simon
								</a>
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</p>
						</div>
					</div>
				</div>

				<div className="tech-container">
					<h2>PEOPLE</h2>
					<div className="tech-description">
						<h3
							onClick={(e) =>
								handleLinkClick(e, 'https://github.com/JamesHall38')
							}
						>
							<a
								href={isInSteamBuild ? '#' : 'https://github.com/JamesHall38'}
								target={isInSteamBuild ? '_self' : '_blank'}
								rel="noopener noreferrer"
								onClick={(e) => isInSteamBuild && e.preventDefault()}
								style={
									isInSteamBuild
										? { cursor: 'default', textDecoration: 'none' }
										: {}
								}
							>
								Game concept, game design & game development
							</a>
							<p
								className="tech-author"
								onClick={(e) =>
									handleLinkClick(e, 'https://github.com/JamesHall38')
								}
							>
								<a
									href={isInSteamBuild ? '#' : 'https://github.com/JamesHall38'}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									James Hall
								</a>
							</p>
							<div className="external-link-icon-container">
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</div>
						</h3>
					</div>
					<div className="tech-description">
						<h3
							onClick={(e) =>
								handleLinkClick(e, 'https://www.linkedin.com/in/lucas-houbre')
							}
						>
							<a
								href={
									isInSteamBuild
										? '#'
										: 'https://www.linkedin.com/in/lucas-houbre'
								}
								target={isInSteamBuild ? '_self' : '_blank'}
								rel="noopener noreferrer"
								onClick={(e) => isInSteamBuild && e.preventDefault()}
								style={
									isInSteamBuild
										? { cursor: 'default', textDecoration: 'none' }
										: {}
								}
							>
								User interface & Art direction
							</a>
							<p
								className="tech-author"
								onClick={(e) =>
									handleLinkClick(e, 'https://www.linkedin.com/in/lucas-houbre')
								}
							>
								<a
									href={
										isInSteamBuild
											? '#'
											: 'https://www.linkedin.com/in/lucas-houbre'
									}
									target={isInSteamBuild ? '_self' : '_blank'}
									rel="noopener noreferrer"
									onClick={(e) => isInSteamBuild && e.preventDefault()}
									style={
										isInSteamBuild
											? { cursor: 'default', textDecoration: 'none' }
											: {}
									}
								>
									Lucas Houbre
								</a>
							</p>
							<div className="external-link-icon-container">
								{!isInSteamBuild && (
									<RxExternalLink className="external-link-icon" />
								)}
							</div>
						</h3>
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
