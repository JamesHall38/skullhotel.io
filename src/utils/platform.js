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

export const openStoreLink = async (url) => {
	if (typeof window !== 'undefined' && window.steamAPI?.openOverlayURL) {
		try {
			const ok = await window.steamAPI.openOverlayURL(url);
			if (ok) return;
		} catch (_e) {
			// fall through to window.open
		}
	}
	if (typeof window !== 'undefined') {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
};
