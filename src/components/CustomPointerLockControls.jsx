import {
	useRef,
	useEffect,
	forwardRef,
	useImperativeHandle,
	useCallback,
} from 'react';
import { useThree } from '@react-three/fiber';
import {
	isPointerLockSupported,
	requestPointerLock,
	exitPointerLock,
	isPointerLocked,
} from '../utils/pointerLock';
import useInterface from '../hooks/useInterface';
import useGame from '../hooks/useGame';

const CustomPointerLockControls = forwardRef((props, ref) => {
	const { gl } = useThree();
	const isLockedRef = useRef(false);
	const eventListenersRef = useRef({});
	const isRequestingLockRef = useRef(false);

	const isAnyPopupOpen = useInterface((state) => state.isAnyPopupOpen);
	const isSettingsOpen = useInterface((state) => state.isSettingsOpen);
	const deviceMode = useGame((state) => state.deviceMode);
	const openDeathScreen = useGame((state) => state.openDeathScreen);
	const disableControls = useGame((state) => state.disableControls);
	const isEndScreen = useGame((state) => state.isEndScreen);
	const isMobile = useGame((state) => state.isMobile);

	const emitEvent = useCallback((eventType) => {
		if (eventListenersRef.current[eventType]) {
			eventListenersRef.current[eventType].forEach((callback) => {
				try {
					callback();
				} catch (error) {
					console.error(`Error in ${eventType} event listener:`, error);
				}
			});
		}
	}, []);

	const shouldAllowPointerLock = useCallback(() => {
		return (
			deviceMode === 'keyboard' &&
			!isMobile &&
			!isAnyPopupOpen &&
			!isSettingsOpen &&
			!openDeathScreen &&
			!disableControls &&
			!isEndScreen &&
			isPointerLockSupported()
		);
	}, [
		deviceMode,
		isMobile,
		isAnyPopupOpen,
		isSettingsOpen,
		openDeathScreen,
		disableControls,
		isEndScreen,
	]);

	useImperativeHandle(
		ref,
		() => ({
			lock: () => {
				if (!isPointerLockSupported()) {
					console.warn('Pointer lock is not supported');
					return false;
				}

				if (isRequestingLockRef.current) {
					console.warn('Pointer lock request already in progress');
					return false;
				}

				const canvas = gl.domElement;
				if (canvas && !isPointerLocked()) {
					isRequestingLockRef.current = true;
					const result = requestPointerLock(canvas);

					setTimeout(() => {
						isRequestingLockRef.current = false;
					}, 100);

					return result;
				}
				return false;
			},
			unlock: () => {
				if (isPointerLocked()) {
					return exitPointerLock();
				}
				return false;
			},
			isLocked: () => isPointerLocked(),
			addEventListener: (event, callback) => {
				if (!eventListenersRef.current[event]) {
					eventListenersRef.current[event] = [];
				}
				eventListenersRef.current[event].push(callback);
			},
			removeEventListener: (event, callback) => {
				if (eventListenersRef.current[event]) {
					const index = eventListenersRef.current[event].indexOf(callback);
					if (index > -1) {
						eventListenersRef.current[event].splice(index, 1);
					}
				}
			},
		}),
		[gl.domElement, emitEvent]
	);

	useEffect(() => {
		const canvas = gl.domElement;
		if (!canvas) return;

		const handlePointerLockChange = () => {
			const isCurrentlyLocked = isPointerLocked();

			if (isCurrentlyLocked !== isLockedRef.current) {
				isLockedRef.current = isCurrentlyLocked;

				isRequestingLockRef.current = false;

				if (isCurrentlyLocked) {
					emitEvent('lock');
				} else {
					emitEvent('unlock');
				}
			}
		};

		const handlePointerLockError = (event) => {
			console.error('Pointer lock error:', event);
			isRequestingLockRef.current = false;
			emitEvent('error');
		};

		const handleCanvasClick = (event) => {
			if (
				shouldAllowPointerLock() &&
				!isPointerLocked() &&
				!isRequestingLockRef.current
			) {
				event.preventDefault();
				isRequestingLockRef.current = true;
				requestPointerLock(canvas);

				setTimeout(() => {
					isRequestingLockRef.current = false;
				}, 1000);
			}
		};

		const handleInterfaceClick = (event) => {
			if (
				shouldAllowPointerLock() &&
				!isPointerLocked() &&
				!isRequestingLockRef.current &&
				event.target !== canvas &&
				!event.target.closest('canvas')
			) {
				const isInteractiveElement =
					event.target.closest('button') ||
					event.target.closest('input') ||
					event.target.closest('select') ||
					event.target.closest('textarea') ||
					event.target.closest('a') ||
					event.target.closest('[role="button"]') ||
					event.target.closest('.popup-container') ||
					event.target.closest('.settings-overlay') ||
					event.target.hasAttribute('data-no-pointer-lock');

				if (!isInteractiveElement) {
					event.preventDefault();
					isRequestingLockRef.current = true;
					requestPointerLock(canvas);

					setTimeout(() => {
						isRequestingLockRef.current = false;
					}, 1000);
				}
			}
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				isRequestingLockRef.current = false;
			}
		};

		document.addEventListener('pointerlockchange', handlePointerLockChange);
		document.addEventListener('pointerlockerror', handlePointerLockError);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		document.addEventListener(
			'webkitpointerlockchange',
			handlePointerLockChange
		);
		document.addEventListener('webkitpointerlockerror', handlePointerLockError);
		document.addEventListener('mozpointerlockchange', handlePointerLockChange);
		document.addEventListener('mozpointerlockerror', handlePointerLockError);

		canvas.addEventListener('click', handleCanvasClick);

		document.addEventListener('click', handleInterfaceClick);

		return () => {
			document.removeEventListener(
				'pointerlockchange',
				handlePointerLockChange
			);
			document.removeEventListener('pointerlockerror', handlePointerLockError);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			document.removeEventListener(
				'webkitpointerlockchange',
				handlePointerLockChange
			);
			document.removeEventListener(
				'webkitpointerlockerror',
				handlePointerLockError
			);
			document.removeEventListener(
				'mozpointerlockchange',
				handlePointerLockChange
			);
			document.removeEventListener(
				'mozpointerlockerror',
				handlePointerLockError
			);
			canvas.removeEventListener('click', handleCanvasClick);
			document.removeEventListener('click', handleInterfaceClick);
		};
	}, [gl.domElement, emitEvent, shouldAllowPointerLock]);

	return null;
});

CustomPointerLockControls.displayName = 'CustomPointerLockControls';

export default CustomPointerLockControls;
