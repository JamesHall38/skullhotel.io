import React, { useEffect, useRef, useState } from 'react';
import { FaSteam } from 'react-icons/fa';
import useLocalization from '../../../hooks/useLocalization';
import useGame from '../../../hooks/useGame';
import AnimatedCloseButton from '../AnimatedCloseButton/AnimatedCloseButton';
import './FirstDeathPopup.css';

const FirstDeathPopup = ({ isVisible, onClose, onWishlist }) => {
	const { t } = useLocalization();
	const deviceMode = useGame((state) => state.deviceMode);
	const lastNavigationTime = useRef(0);
	const prevButtonState = useRef({ a: false, x: false, b: false });
	const [canClose, setCanClose] = useState(false);

	const handleWishlistClick = (e) => {
		e.stopPropagation();
		onWishlist();
	};

	const handleCloseClick = (e) => {
		e.stopPropagation();
		if (canClose) {
			onClose();
		}
	};

	const handleBackdropClick = (e) => {
		e.stopPropagation();
		if (e.target === e.currentTarget && canClose) {
			onClose();
		}
	};

	const handlePopupClick = (e) => {
		e.stopPropagation();
	};

	useEffect(() => {
		if (isVisible) {
			setCanClose(false);
			const timer = setTimeout(() => {
				setCanClose(true);
			}, 1000); // 1 second delay

			return () => clearTimeout(timer);
		}
	}, [isVisible]);

	useEffect(() => {
		if (!isVisible || deviceMode !== 'gamepad' || !canClose) return;

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

			const aButtonPressed = gamepad.buttons[0]?.pressed; // A button
			const xButtonPressed = gamepad.buttons[2]?.pressed; // X button
			const bButtonPressed = gamepad.buttons[1]?.pressed; // B button

			if (
				(aButtonPressed || xButtonPressed || bButtonPressed) &&
				!prevButtonState.current.a &&
				!prevButtonState.current.x &&
				!prevButtonState.current.b
			) {
				onClose();
				lastNavigationTime.current = now;
			}

			prevButtonState.current = {
				a: aButtonPressed,
				x: xButtonPressed,
				b: bButtonPressed,
			};
		};

		const interval = setInterval(handleGamepadNavigation, 16); // ~60fps
		return () => clearInterval(interval);
	}, [isVisible, deviceMode, onClose, canClose]);

	if (!isVisible) return null;

	return (
		<div className="first-death-popup-backdrop" onClick={handleBackdropClick}>
			<div className="first-death-popup" onClick={handlePopupClick}>
				<div className="first-death-popup-close">
					<AnimatedCloseButton
						onClick={handleCloseClick}
						size={1}
						className={deviceMode === 'gamepad' ? 'gamepad-focus' : ''}
					/>
				</div>

				<div className="first-death-popup-content">
					<h2 className="first-death-popup-title">
						{t('ui.firstDeathPopup.title')}
					</h2>

					<p className="first-death-popup-message">
						{t('ui.firstDeathPopup.message')
							.split('\n')
							.map((line, index) => (
								<span key={index}>
									{line}
									{index <
										t('ui.firstDeathPopup.message').split('\n').length - 1 && (
										<br />
									)}
								</span>
							))}
					</p>

					<div className="first-death-popup-buttons">
						<button
							className="first-death-popup-wishlist-btn"
							onClick={handleWishlistClick}
						>
							<FaSteam />
							<span>Wishlist on Steam</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FirstDeathPopup;
