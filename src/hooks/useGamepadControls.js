import { useEffect, useRef, useCallback } from 'react';
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
	});

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

				// Mouvement
				controlsRef.current.left = leftStickX < -0.1;
				controlsRef.current.right = leftStickX > 0.1;
				controlsRef.current.forward = leftStickY < -0.1;
				controlsRef.current.backward = leftStickY > 0.1;

				// Rotation de la caméra
				// controlsRef.current.lookLeft = rightStickX;
				// controlsRef.current.lookRight = rightStickX;
				// controlsRef.current.lookUp = rightStickY;
				// controlsRef.current.lookDown = rightStickY;
				controlsRef.current.rightStickX = rightStickX;
				controlsRef.current.rightStickY = rightStickY;

				// Actions
				controlsRef.current.jump = gamepad.buttons[0].pressed;
				controlsRef.current.action = gamepad.buttons[1].pressed;
				controlsRef.current.run = gamepad.buttons[10].pressed;
				controlsRef.current.crouch = gamepad.buttons[11].pressed;
			}
		}
	}, [deviceMode, setDeviceMode]);

	useEffect(() => {
		const handleKeyboardInput = (event) => {
			if (event.code) {
				setDeviceMode('keyboard');
			}
		};

		const gamepadLoop = () => {
			handleGamepadInput();
			requestAnimationFrame(gamepadLoop);
		};

		gamepadLoop();
		window.addEventListener('keydown', handleKeyboardInput);

		return () => {
			cancelAnimationFrame(gamepadLoop);
			window.removeEventListener('keydown', handleKeyboardInput);
		};
	}, [controlsRef, deviceMode, setDeviceMode, handleGamepadInput]);

	return () => controlsRef.current;
};

export default useGamepadControls;
