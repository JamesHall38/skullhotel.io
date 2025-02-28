import { useEffect, useRef, useState } from 'react';
import { a, useSpring, config } from '@react-spring/web';
import { RxHamburgerMenu } from 'react-icons/rx';
import { RiFullscreenFill } from 'react-icons/ri';
import { IoClose } from 'react-icons/io5';
import useSettings from '../../hooks/useSettings';
import './Settings.css';

export default function Settings() {
	const popupRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [currentWidth, setCurrentWidth] = useState(25 * getRemValue());
	const rotationSensitivity = useSettings((state) => state.rotationSensitivity);
	const setRotationSensitivity = useSettings(
		(state) => state.setRotationSensitivity
	);
	const shadows = useSettings((state) => state.shadows);
	const setShadows = useSettings((state) => state.setShadows);

	function getRemValue() {
		const width = window.innerWidth;
		if (width >= 1200) return 18;
		if (width >= 992) return 16;
		if (width >= 768) return 15;
		if (width >= 576) return 14;
		return 12;
	}

	const [{ x }, api] = useSpring(() => ({ x: -currentWidth }));

	useEffect(() => {
		const handleResize = () => {
			const newWidth = 25 * getRemValue();
			setCurrentWidth(newWidth);
			api.start({ x: isOpen ? 0 : -newWidth });
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [isOpen, currentWidth, api]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target) &&
				isOpen
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	useEffect(() => {
		api.start({
			x: isOpen ? 0 : -currentWidth,
			immediate: false,
			config: config.stiff,
		});
	}, [isOpen, currentWidth, api]);

	const fullScreenHandler = (e) => {
		e.stopPropagation();
		if (!document.fullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				// Firefox
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				// Chrome, Safari and Opera
				document.documentElement.webkitRequestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				// IE/Edge
				document.documentElement.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				// Firefox
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				// Chrome, Safari and Opera
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				// IE/Edge
				document.msExitFullscreen();
			}
		}
	};

	return (
		<div ref={popupRef} onClick={(e) => e.stopPropagation()}>
			<a.div className="sheet" style={{ x }}>
				<div className="menu-content">
					<h1>Settings</h1>
					<div className="settings-group">
						<label htmlFor="sensitivity">Rotation Sensitivity</label>
						<input
							type="range"
							id="sensitivity"
							min="0.001"
							max="1"
							step="0.001"
							value={rotationSensitivity}
							onChange={(e) =>
								setRotationSensitivity(parseFloat(e.target.value))
							}
						/>
						<span className="sensitivity-value">
							{Math.round(((rotationSensitivity - 0.001) / (1 - 0.001)) * 100)}
						</span>
					</div>
					<div className="settings-group">
						<label htmlFor="shadows">Shadows</label>
						<input
							type="checkbox"
							id="shadows"
							checked={shadows}
							onChange={(e) => setShadows(e.target.checked)}
						/>
					</div>
					<button className="settings-button" onClick={fullScreenHandler}>
						full screen
						<RiFullscreenFill />
					</button>
				</div>
				<button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
					{isOpen ? (
						<IoClose className="menu-icon" />
					) : (
						<RxHamburgerMenu className="menu-icon" />
					)}
				</button>
			</a.div>
		</div>
	);
}
