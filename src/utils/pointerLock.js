export const isPointerLockSupported = () => {
	return (
		'pointerLockElement' in document &&
		'requestPointerLock' in document.documentElement
	);
};

export const requestPointerLock = (element) => {
	if (!element) return false;

	if (element.requestPointerLock) {
		try {
			element.requestPointerLock();
			return true;
		} catch (error) {
			console.warn('Error requesting pointer lock:', error);
			return false;
		}
	}
	return false;
};

export const exitPointerLock = () => {
	if (document.exitPointerLock) {
		try {
			document.exitPointerLock();
			return true;
		} catch (error) {
			console.warn('Error exiting pointer lock:', error);
			return false;
		}
	}
	return false;
};

export const isPointerLocked = () => {
	return !!document.pointerLockElement;
};
