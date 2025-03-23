import PopupWrapper from '../PopupWrapper/PopupWrapper';
import { IoCloseOutline } from 'react-icons/io5';
import { SiThreedotjs } from 'react-icons/si';
import './HowItsMade.css';

function HowItsMadeContent({ onClose }) {
	return (
		<div className="how-its-made-content">
			<div className="how-its-made-header">
				<h2>How It&apos;s Made</h2>
				<button onClick={onClose} className="close-button">
					<IoCloseOutline />
				</button>
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
								three.js
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
								Ricardo Cabello (mrdoob)
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
							<path d="M800 0H280v230.579h280v280.704h240z" />
							<path d="M520 270.679H280v240.604h240zM0 270.679h240v240.604H0zM520 551.384H280V797h240z" />
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
							<path d="M23.1,55.7l16.1-9.3c0,0,0,0,0,0c1.1-0.7,1.8-1.9,1.8-3.1l0.1-19.1L23.1,34.4V55.7z" />
							<path d="M21.3,10L2.9,20.5l18,10.2l18.4-10.5c0,0,0,0-0.1,0l-17.4-10C21.7,10.1,21.5,10.1,21.3,10z" />
							<path d="M1.8,46.7L18,56.6c0,0,0,0,0,0c0.3,0.2,0.5,0.3,0.8,0.3V34.5L0,23.8v19.7C0,44.9,0.7,46.1,1.8,46.7z" />
							<path d="M56.8,30.4l-11.4-6.6l-0.1,19.2l11.5-6.7c1-0.6,1.7-1.7,1.7-2.9C58.5,32.1,57.9,31,56.8,30.4z" />
							<path d="M0,50.7v12.6c0,1.2,0.6,2.3,1.7,2.9c0.5,0.3,1.1,0.5,1.7,0.5c0.6,0,1.2-0.2,1.7-0.5l10.4-6L0,50.7z" />
							<path d="M16.4,7L5.1,0.5c-1-0.6-2.3-0.6-3.4,0C0.6,1.1,0,2.2,0,3.4v13.2L16.4,7z" />
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
		<PopupWrapper cursorType="help-howItsMade">
			<HowItsMadeContent />
		</PopupWrapper>
	);
}
