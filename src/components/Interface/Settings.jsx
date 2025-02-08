import { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { a, useSpring, config } from '@react-spring/web';
import { RxHamburgerMenu } from 'react-icons/rx';
import { RiFullscreenFill } from 'react-icons/ri';
import { IoClose } from 'react-icons/io5';
import './Settings.css';

export default function Settings() {
	const popupRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [currentWidth, setCurrentWidth] = useState(25 * getRemValue());

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

	const bind = useDrag(
		({ last, velocity: [vx], direction: [dx], offset: [ox] }) => {
			if (last) {
				const shouldClose = ox < -currentWidth * 0.5 || (vx < -0.5 && dx < 0);
				setIsOpen(!shouldClose);
			} else {
				api.start({ x: ox, immediate: true });
			}
		},
		{
			from: () => [x.get(), 0],
			bounds: { right: 0, left: -currentWidth },
			rubberband: true,
			filterTaps: true,
		}
	);

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
			<a.div className="sheet" {...bind()} style={{ x }}>
				<div className="menu-content">
					<h1>Settings</h1>
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
