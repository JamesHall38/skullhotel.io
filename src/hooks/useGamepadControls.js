import { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from './useGame';

const useGamepadControls = () => {
	const deviceMode = useGame((state) => state.deviceMode);
	const setDeviceMode = useGame((state) => state.setDeviceMode);
	const controlsRef = useRef({
		left: false,
		right: false,
		forward: false,
		backward: false,
		jump: false,
		action: false,
		run: false,
		crouch: false,
		rightStickX: 0,
		rightStickY: 0,
		leftClick: false,
		rightClick: false,
		leftStickX: 0,
		leftStickY: 0,
	});

	useEffect(() => {
		const handleMouseMove = (event) => {
			if (
				deviceMode === 'gamepad' &&
				(event.movementX !== 0 || event.movementY !== 0)
			) {
				setDeviceMode('keyboard');
			}
		};

		window.addEventListener('mousemove', handleMouseMove);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	}, [deviceMode, setDeviceMode]);

	const handleGamepadInput = useCallback(() => {
		const gamepads = navigator.getGamepads();
		for (const gamepad of gamepads) {
			if (gamepad && gamepad.connected) {
				const gamepadActive =
					gamepad.buttons.some((button) => button.pressed) ||
					gamepad.axes.some((axis) => Math.abs(axis) > 0.2);

				if (gamepadActive && deviceMode !== 'gamepad') {
					setDeviceMode('gamepad');
				}

				if (deviceMode !== 'gamepad') {
					return;
				}

				const leftStickX = gamepad.axes[0];
				const leftStickY = gamepad.axes[1];
				const rightStickX = gamepad.axes[2];
				const rightStickY = gamepad.axes[3];

				const DEADZONE = 0.15;

				controlsRef.current.leftStickX =
					Math.abs(leftStickX) > DEADZONE ? leftStickX : 0;
				controlsRef.current.leftStickY =
					Math.abs(leftStickY) > DEADZONE ? leftStickY : 0;

				controlsRef.current.left = leftStickX < -DEADZONE;
				controlsRef.current.right = leftStickX > DEADZONE;
				controlsRef.current.forward = leftStickY < -DEADZONE;
				controlsRef.current.backward = leftStickY > DEADZONE;

				controlsRef.current.rightStickX =
					Math.abs(rightStickX) > DEADZONE ? rightStickX : 0;
				controlsRef.current.rightStickY =
					Math.abs(rightStickY) > DEADZONE ? rightStickY : 0;

				controlsRef.current.jump = gamepad.buttons[0].pressed; // A
				controlsRef.current.crouch = gamepad.buttons[1].pressed; // B

				const xButtonPressed = gamepad.buttons[2].pressed;
				if (xButtonPressed && !controlsRef.current.leftClick) {
					const clickEvent = new MouseEvent('click', {
						bubbles: true,
						cancelable: true,
						view: window,
						button: 0,
					});
					document.dispatchEvent(clickEvent);
				}
				controlsRef.current.leftClick = xButtonPressed;

				controlsRef.current.rightClick = gamepad.buttons[3].pressed; // Y
				controlsRef.current.action = gamepad.buttons[2].pressed; // X
				controlsRef.current.run = gamepad.buttons[10].pressed; // L3
			}
		}
	}, [deviceMode, setDeviceMode]);

	useFrame(() => {
		handleGamepadInput();
	});

	return () => controlsRef.current;
};

export default useGamepadControls;
