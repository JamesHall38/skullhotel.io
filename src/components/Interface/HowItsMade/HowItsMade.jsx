import { useEffect, useRef, useState } from 'react';
import PopupWrapper from '../PopupWrapper/PopupWrapper';
import AnimatedCloseButton from '../AnimatedCloseButton/AnimatedCloseButton';
import { SiThreedotjs } from 'react-icons/si';
import useGame from '../../../hooks/useGame';
import './HowItsMade.css';

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
			const elements = contentRef.current.querySelectorAll('button, a');

			const filteredElements = Array.from(elements).filter(
				(element) => !element.hasAttribute('data-gamepad-skip')
			);

			setFocusableElements(filteredElements);
			if (filteredElements.length > 0) {
				setCurrentFocus(0);
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

			const dpadUp = gamepad.buttons[12]?.pressed;
			const dpadDown = gamepad.buttons[13]?.pressed;

			const leftStickY = gamepad.axes[1];
			const DEADZONE = 0.5;
			const stickUp = leftStickY < -DEADZONE;
			const stickDown = leftStickY > DEADZONE;

			const up = dpadUp || stickUp;
			const down = dpadDown || stickDown;

			let shouldUpdateNavigationTime = false;

			if (up) {
				setCurrentFocus((prev) => Math.max(0, prev - 1));
				shouldUpdateNavigationTime = true;
			} else if (down) {
				setCurrentFocus((prev) =>
					Math.min(focusableElements.length - 1, prev + 1)
				);
				shouldUpdateNavigationTime = true;
			}

			const aButtonPressed = gamepad.buttons[0]?.pressed;

			if (
				aButtonPressed &&
				!lastAButtonState.current &&
				!linkClickedRef.current
			) {
				if (currentFocus >= 0 && currentFocus < focusableElements.length) {
					const focusedEl = focusableElements[currentFocus];
					if (focusedEl.tagName === 'A') {
						linkClickedRef.current = true;
						window.open(focusedEl.href, '_blank');

						setTimeout(() => {
							linkClickedRef.current = false;
						}, 1000);
					} else if (focusedEl.tagName === 'BUTTON') {
						focusedEl.click();
					}
					shouldUpdateNavigationTime = true;
				}
			}

			lastAButtonState.current = aButtonPressed;

			const bButtonPressed = gamepad.buttons[1]?.pressed;
			if (bButtonPressed) {
				onClose();
				shouldUpdateNavigationTime = true;
			}

			if (shouldUpdateNavigationTime) {
				lastNavigationTime.current = now;
			}
		};

		const interval = setInterval(handleGamepadNavigation, 16); // ~60fps
		return () => clearInterval(interval);
	}, [deviceMode, currentFocus, focusableElements, onClose]);

	return (
		<div className="how-its-made-content" ref={contentRef}>
			<div className="how-its-made-header">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="196"
					height="34"
					viewBox="0 0 196 34"
					fill="none"
				>
					<path
						d="M167.807 0.675231C168.592 0.0345225 169.751 0.0807263 170.483 0.812927C171.216 1.54517 171.262 2.70416 170.621 3.48968L170.483 3.64105L159.351 14.7729H166.241L180.201 0.812927L180.353 0.675231C181.138 0.0345225 182.297 0.0807263 183.029 0.812927C183.761 1.54517 183.808 2.70421 183.167 3.48968L183.029 3.64105L171.896 14.7729H182.826L188.372 9.22699L195.918 16.7729L188.372 24.3188L182.826 18.7729H171.746L183.332 30.3588L183.47 30.5102C184.11 31.2957 184.064 32.4547 183.332 33.187C182.6 33.9192 181.441 33.9654 180.655 33.3246L180.504 33.187L166.09 18.7729H159.2L170.786 30.3588L170.924 30.5102C171.565 31.2957 171.518 32.4547 170.786 33.187C170.054 33.9192 168.895 33.9654 168.109 33.3246L167.958 33.187L153.544 18.7729H15.793V14.7729H153.695L167.655 0.812927L167.807 0.675231ZM146.342 7.45453H13.5801L5.30957 16.477L13.5801 25.4995H146.342V29.4995H12.7012C12.1407 29.4994 11.6063 29.2642 11.2275 28.851L1.35156 18.0786L0 16.6039L0.137695 16.477L0 16.35L1.35156 14.8754L11.2275 4.10297C11.6063 3.68981 12.1407 3.45459 12.7012 3.45453H146.342V7.45453Z"
						fill="#EFD89B"
					/>
				</svg>
				<h2>How It&apos;s Made</h2>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="196"
					height="34"
					viewBox="0 0 196 34"
					fill="none"
					style={{ transform: 'rotate(180deg)' }}
				>
					<path
						d="M167.807 0.675231C168.592 0.0345225 169.751 0.0807263 170.483 0.812927C171.216 1.54517 171.262 2.70416 170.621 3.48968L170.483 3.64105L159.351 14.7729H166.241L180.201 0.812927L180.353 0.675231C181.138 0.0345225 182.297 0.0807263 183.029 0.812927C183.761 1.54517 183.808 2.70421 183.167 3.48968L183.029 3.64105L171.896 14.7729H182.826L188.372 9.22699L195.918 16.7729L188.372 24.3188L182.826 18.7729H171.746L183.332 30.3588L183.47 30.5102C184.11 31.2957 184.064 32.4547 183.332 33.187C182.6 33.9192 181.441 33.9654 180.655 33.3246L180.504 33.187L166.09 18.7729H159.2L170.786 30.3588L170.924 30.5102C171.565 31.2957 171.518 32.4547 170.786 33.187C170.054 33.9192 168.895 33.9654 168.109 33.3246L167.958 33.187L153.544 18.7729H15.793V14.7729H153.695L167.655 0.812927L167.807 0.675231ZM146.342 7.45453H13.5801L5.30957 16.477L13.5801 25.4995H146.342V29.4995H12.7012C12.1407 29.4994 11.6063 29.2642 11.2275 28.851L1.35156 18.0786L0 16.6039L0.137695 16.477L0 16.35L1.35156 14.8754L11.2275 4.10297C11.6063 3.68981 12.1407 3.45459 12.7012 3.45453H146.342V7.45453Z"
						fill="#EFD89B"
					/>
				</svg>
				<div className="close-container">
					<AnimatedCloseButton onClick={onClose} size={1} />
				</div>
			</div>

			<div className="tech-container">
				<div className="tech-item">
					<div className="tech-icon">
						<SiThreedotjs />
					</div>
					<div className="tech-description">
						<h3>
							<a
								href="https://threejs.org/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Three.js
							</a>
						</h3>
						<p>A JavaScript library for creating 3D graphics in the browser</p>
						<p className="tech-author">
							Created by{' '}
							<a
								href="https://github.com/mrdoob"
								target="_blank"
								rel="noopener noreferrer"
							>
								mrdoob
							</a>
						</p>
					</div>
				</div>

				<div className="tech-item">
					<div className="tech-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 800 797"
							width="38"
							height="38"
						>
							<path fill="#efd89b" d="M800 0H280v230.579h280v280.704h240z" />
							<path
								fill="#efd89b"
								d="M520 270.679H280v240.604h240zM0 270.679h240v240.604H0zM520 551.384H280V797h240z"
							/>
						</svg>
					</div>
					<div className="tech-description">
						<h3>
							<a
								href="https://r3f.docs.pmnd.rs/"
								target="_blank"
								rel="noopener noreferrer"
							>
								React Three Fiber
							</a>
						</h3>
						<p>A tool that makes it easier to use three.js with React</p>
						<p className="tech-author">
							Created by{' '}
							<a
								href="https://github.com/pmndrs"
								target="_blank"
								rel="noopener noreferrer"
							>
								Poimandres
							</a>
						</p>
					</div>
				</div>

				<div className="tech-item">
					<div className="tech-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 58.5 66.6"
							width="38"
							height="38"
						>
							<path
								fill="#efd89b"
								d="M23.1,55.7l16.1-9.3c0,0,0,0,0,0c1.1-0.7,1.8-1.9,1.8-3.1l0.1-19.1L23.1,34.4V55.7z"
							/>
							<path
								fill="#efd89b"
								d="M21.3,10L2.9,20.5l18,10.2l18.4-10.5c0,0,0,0-0.1,0l-17.4-10C21.7,10.1,21.5,10.1,21.3,10z"
							/>
							<path
								fill="#efd89b"
								d="M1.8,46.7L18,56.6c0,0,0,0,0,0c0.3,0.2,0.5,0.3,0.8,0.3V34.5L0,23.8v19.7C0,44.9,0.7,46.1,1.8,46.7z"
							/>
							<path
								fill="#efd89b"
								d="M56.8,30.4l-11.4-6.6l-0.1,19.2l11.5-6.7c1-0.6,1.7-1.7,1.7-2.9C58.5,32.1,57.9,31,56.8,30.4z"
							/>
							<path
								fill="#efd89b"
								d="M0,50.7v12.6c0,1.2,0.6,2.3,1.7,2.9c0.5,0.3,1.1,0.5,1.7,0.5c0.6,0,1.2-0.2,1.7-0.5l10.4-6L0,50.7z"
							/>
							<path
								fill="#efd89b"
								d="M16.4,7L5.1,0.5c-1-0.6-2.3-0.6-3.4,0C0.6,1.1,0,2.2,0,3.4v13.2L16.4,7z"
							/>
						</svg>
					</div>
					<div className="tech-description">
						<h3>
							<a
								href="https://threejs-journey.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Three.js Journey
							</a>
						</h3>
						<p>An online course to learn 3D for the web</p>
						<p className="tech-author">
							Created by{' '}
							<a
								href="https://github.com/brunosimon"
								target="_blank"
								rel="noopener noreferrer"
							>
								Bruno Simon
							</a>
						</p>
					</div>
				</div>
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
	);
}

export default function HowItsMade() {
	return (
		<PopupWrapper cursorType="help">
			<HowItsMadeContent />
		</PopupWrapper>
	);
}
