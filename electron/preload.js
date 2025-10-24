const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('steamAPI', {
	gameCompleted: () => ipcRenderer.invoke('steam-game-completed'),
	allHideoutsFound: () => ipcRenderer.invoke('steam-all-hideouts-found'),
	guestbookSigned: () => ipcRenderer.invoke('steam-guestbook-signed'),
	unnecessaryFear: () => ipcRenderer.invoke('steam-unnecessary-fear'),
	resetAchievement: (achievementId) =>
		ipcRenderer.invoke('steam-reset-achievement', achievementId),
});

contextBridge.exposeInMainWorld('electronAPI', {
	toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
	isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
});
