export const isPointerLockSupported = () => {
	return (
		('pointerLockElement' in document ||
			'webkitPointerLockElement' in document ||
			'mozPointerLockElement' in document) &&
		('requestPointerLock' in document.documentElement ||
			'webkitRequestPointerLock' in document.documentElement ||
			'mozRequestPointerLock' in document.documentElement)
	);
};

export const requestPointerLock = (element) => {
	if (!element) return false;

	const requestMethod =
		element.requestPointerLock ||
		element.webkitRequestPointerLock ||
		element.mozRequestPointerLock;

	if (requestMethod) {
		try {
			if (element.webkitRequestPointerLock) {
				requestMethod.call(element, { unadjustedMovement: true });
			} else {
				requestMethod.call(element);
			}
			return true;
		} catch (error) {
			console.warn('Error requesting pointer lock:', error);
			try {
				requestMethod.call(element);
				return true;
			} catch (fallbackError) {
				console.warn('Fallback pointer lock request failed:', fallbackError);
				return false;
			}
		}
	}
	return false;
};

export const exitPointerLock = () => {
	const exitMethod =
		document.exitPointerLock ||
		document.webkitExitPointerLock ||
		document.mozExitPointerLock;

	if (exitMethod) {
		try {
			exitMethod.call(document);
			return true;
		} catch (error) {
			console.warn('Error exiting pointer lock:', error);
			return false;
		}
	}
	return false;
};

export const isPointerLocked = () => {
	return !!(
		document.pointerLockElement ||
		document.webkitPointerLockElement ||
		document.mozPointerLockElement
	);
};

export const getPointerLockElement = () => {
	return (
		document.pointerLockElement ||
		document.webkitPointerLockElement ||
		document.mozPointerLockElement ||
		null
	);
};
