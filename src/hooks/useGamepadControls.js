import { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from './useGame';

let vibrateControllersGlobal = (intensity = 1.0, duration = 500) => {
	const gamepads = navigator.getGamepads();

	for (const gamepad of gamepads) {
		if (!gamepad || !gamepad.connected) continue;

		if (gamepad.vibrationActuator) {
			gamepad.vibrationActuator.playEffect('dual-rumble', {
				startDelay: 0,
				duration: duration,
				weakMagnitude: intensity * 0.5,
				strongMagnitude: intensity,
			});
		}
	}
};

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
	const buttonStateHistoryRef = useRef([]);
	const MAX_HISTORY = 3;
	const gamepadsRef = useRef([]);

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

	vibrateControllersGlobal = (intensity = 1.0, duration = 500) => {
		const gamepads = navigator.getGamepads();

		for (const gamepad of gamepads) {
			if (!gamepad || !gamepad.connected) continue;

			if (gamepad.vibrationActuator) {
				gamepad.vibrationActuator.playEffect('dual-rumble', {
					startDelay: 0,
					duration: duration,
					weakMagnitude: intensity * 0.5,
					strongMagnitude: intensity,
				});
			}
		}
	};

	const handleGamepadInput = useCallback(() => {
		const gamepads = navigator.getGamepads();
		gamepadsRef.current = gamepads;
		let anyGamepadActive = false;

		const controls = {
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
		};

		for (const gamepad of gamepads) {
			if (!gamepad || !gamepad.connected) continue;

			const gamepadActive =
				gamepad.buttons.some((button) => button.pressed) ||
				gamepad.axes.some((axis) => Math.abs(axis) > 0.2);

			if (gamepadActive) {
				anyGamepadActive = true;
			}

			const leftStickX = gamepad.axes[0];
			const leftStickY = gamepad.axes[1];
			const rightStickX = gamepad.axes[2];
			const rightStickY = gamepad.axes[3];

			const DEADZONE = 0.15;

			if (Math.abs(leftStickX) > Math.abs(controls.leftStickX)) {
				controls.leftStickX = Math.abs(leftStickX) > DEADZONE ? leftStickX : 0;
			}

			if (Math.abs(leftStickY) > Math.abs(controls.leftStickY)) {
				controls.leftStickY = Math.abs(leftStickY) > DEADZONE ? leftStickY : 0;
			}

			controls.left = controls.left || leftStickX < -DEADZONE;
			controls.right = controls.right || leftStickX > DEADZONE;
			controls.forward = controls.forward || leftStickY < -DEADZONE;
			controls.backward = controls.backward || leftStickY > DEADZONE;

			if (Math.abs(rightStickX) > Math.abs(controls.rightStickX)) {
				controls.rightStickX =
					Math.abs(rightStickX) > DEADZONE ? rightStickX : 0;
			}

			if (Math.abs(rightStickY) > Math.abs(controls.rightStickY)) {
				controls.rightStickY =
					Math.abs(rightStickY) > DEADZONE ? rightStickY : 0;
			}

			controls.jump = controls.jump || gamepad.buttons[0].pressed; // A

			const bButtonPressed = gamepad.buttons[1].pressed;

			buttonStateHistoryRef.current.push(bButtonPressed);
			if (buttonStateHistoryRef.current.length > MAX_HISTORY) {
				buttonStateHistoryRef.current.shift();
			}

			controls.crouch = bButtonPressed;

			const xButtonPressed = gamepad.buttons[2].pressed;
			const leftTriggerPressed = gamepad.buttons[6].pressed; // L2/LT
			const rightTriggerPressed = gamepad.buttons[7].pressed; // R2/RT
			const actionButtonPressed =
				xButtonPressed || leftTriggerPressed || rightTriggerPressed;

			controls.action = controls.action || actionButtonPressed; // X ou L2/LT ou R2/RT
			controls.rightClick = controls.rightClick || gamepad.buttons[3].pressed; // Y
			controls.run = controls.run || gamepad.buttons[10].pressed; // L3
		}

		if (anyGamepadActive && deviceMode !== 'gamepad') {
			setDeviceMode('gamepad');
		}

		if (deviceMode === 'gamepad') {
			Object.assign(controlsRef.current, controls);

			if (controls.action && !controlsRef.current.leftClick) {
				const clickEvent = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					view: window,
					button: 0,
				});
				document.dispatchEvent(clickEvent);
			}
			controlsRef.current.leftClick = controls.action;
		}
	}, [deviceMode, setDeviceMode]);

	useFrame(() => {
		handleGamepadInput();
	});

	return () => controlsRef.current;
};

export const vibrateControllers = vibrateControllersGlobal;

export default useGamepadControls;
