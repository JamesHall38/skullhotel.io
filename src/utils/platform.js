export const isElectron = () => {
	if (typeof window === 'undefined') {
		return false;
	}

	return (
		/electron/i.test(navigator.userAgent) ||
		(window.process &&
			window.process.versions &&
			window.process.versions.electron) ||
		window.electronAPI !== undefined ||
		window.location.protocol === 'file:'
	);
};

export const isSteamBuild = () => {
	return isElectron();
};
