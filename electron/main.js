/* eslint-disable no-undef */
const {
	app,
	BrowserWindow,
	protocol,
	Menu,
	ipcMain,
	screen,
} = require('electron');
const path = require('path');
const fs = require('fs');
const process = require('process');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch(
	'disable-features',
	'VizDisplayCompositor,OutOfBlinkCors'
);
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let mainWindow;
let steamworks;
let steamClient;

try {
	steamworks = require('steamworks.js');
	steamworks.electronEnableSteamOverlay(true);
	steamClient = steamworks.init(3739730);

	setInterval(() => {
		if (steamClient && steamClient.runCallbacks) {
			steamClient.runCallbacks();
		}
	}, 100);
} catch (e) {
	console.warn('Steamworks initialization failed:', e);
}

const isPackaged = app.isPackaged;

function getBasePath() {
	if (isPackaged) {
		return path.join(process.resourcesPath, 'app', 'build');
	} else {
		return path.join(process.cwd(), 'build');
	}
}

function fixPaths() {
	const buildDir = getBasePath();

	if (!fs.existsSync(buildDir)) {
		console.error('Build directory does not exist:', buildDir);
		return;
	}

	const mainJsPath = path.join(buildDir, 'assets', 'main.js');
	if (fs.existsSync(mainJsPath)) {
		let content = fs.readFileSync(mainJsPath, 'utf8');

		const replacements = [
			{ from: '"/models/', to: '"models/' },
			{ from: "'/models/", to: "'models/" },
			{ from: '"/sounds/', to: '"sounds/' },
			{ from: "'/sounds/", to: "'sounds/" },
			{ from: '"/textures/', to: '"textures/' },
			{ from: "'/textures/", to: "'textures/" },
			{ from: '"/Redrum.otf', to: '"Redrum.otf' },
			{ from: "'/Redrum.otf", to: "'Redrum.otf" },
			{ from: '"/Futura.ttf', to: '"Futura.ttf' },
			{ from: "'/Futura.ttf", to: "'Futura.ttf" },
			{ from: '"/Lincoln-Road-Deco.ttf', to: '"Lincoln-Road-Deco.ttf' },
			{ from: "'/Lincoln-Road-Deco.ttf", to: "'Lincoln-Road-Deco.ttf" },
			{ from: '"/Lincoln-Road-Regular.ttf', to: '"Lincoln-Road-Regular.ttf' },
			{ from: "'/Lincoln-Road-Regular.ttf", to: "'Lincoln-Road-Regular.ttf" },
			{ from: '"/EB_Garamond_Regular.json', to: '"EB_Garamond_Regular.json' },
			{ from: "'/EB_Garamond_Regular.json", to: "'EB_Garamond_Regular.json" },
		];

		for (const { from, to } of replacements) {
			content = content.split(from).join(to);
		}

		fs.writeFileSync(mainJsPath, content);
	} else {
		console.error('Could not find main.js at:', mainJsPath);
	}

	const indexHtmlPath = path.join(buildDir, 'index.html');
	if (fs.existsSync(indexHtmlPath)) {
		let content = fs.readFileSync(indexHtmlPath, 'utf8');

		content = content.split('href="/').join('href="');
		content = content.split('src="/').join('src="');
		content = content.split('href="./').join('href="');
		content = content.split('src="./').join('src="');

		fs.writeFileSync(indexHtmlPath, content);
	} else {
		console.error('Could not find index.html at:', indexHtmlPath);
	}
}

function createWindow() {
	fixPaths();

	protocol.registerFileProtocol('game', (request) => {
		const url = request.url.replace('game://', '');
		try {
			return { path: path.join(getBasePath(), url) };
		} catch (error) {
			console.error(error);
			return { error: 404 };
		}
	});

	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	mainWindow = new BrowserWindow({
		width: width,
		height: height,
		title: 'Skull Hotel',
		icon: path.join(
			process.cwd(),
			'public',
			'images',
			'web-app-manifest-512x512.png'
		),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: false,
			preload: path.join(__dirname, 'preload.js'),
		},
		autoHideMenuBar: true,
		fullscreen: true,
	});

	const template = [
		{
			label: 'View',
			submenu: [
				{
					label: 'Toggle Fullscreen',
					accelerator: 'F11',
					click: () => {
						const isFullScreen = mainWindow.isFullScreen();
						mainWindow.setFullScreen(!isFullScreen);
					},
				},
				{ type: 'separator' },
				{
					label: 'Toggle Menu Bar',
					accelerator: 'Alt+M',
					click: () => {
						const isVisible = mainWindow.isMenuBarVisible();
						mainWindow.setMenuBarVisibility(!isVisible);
						mainWindow.setAutoHideMenuBar(isVisible);
					},
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);

	mainWindow.on('enter-full-screen', () => {
		mainWindow.setMenuBarVisibility(false);
		if (mainWindow && mainWindow.webContents) {
			mainWindow.webContents.send('fullscreen-changed', true);
		}
	});

	mainWindow.on('leave-full-screen', () => {
		mainWindow.setAutoHideMenuBar(true);
		mainWindow.setMenuBarVisibility(false);
		if (mainWindow && mainWindow.webContents) {
			mainWindow.webContents.send('fullscreen-changed', false);
		}
	});

	const indexPath = path.join(getBasePath(), 'index.html');

	const startUrl = `file://${indexPath}`;

	mainWindow.loadURL(startUrl);

	mainWindow.once('ready-to-show', () => {
		if (!mainWindow.isFullScreen()) {
			mainWindow.setFullScreen(true);
		}
		setTimeout(() => {
			if (mainWindow && mainWindow.webContents) {
				mainWindow.webContents.send('fullscreen-changed', true);
			}
		}, 100);
	});

	if (!isPackaged) {
		mainWindow.webContents.openDevTools();
	}

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}

const unlockAchievement = (achievementId) => {
	if (
		steamClient &&
		steamClient.achievement &&
		steamClient.achievement.activate
	) {
		try {
			steamClient.achievement.activate(achievementId);
			if (steamClient.runCallbacks) {
				steamClient.runCallbacks();
			}
			return true;
		} catch (error) {
			console.error('Failed to unlock achievement:', error);
			return false;
		}
	}
	console.warn('❌ Steam client not available');
	return false;
};

ipcMain.handle('steam-game-completed', () => {
	return unlockAchievement('GAME_COMPLETED');
});

ipcMain.handle('steam-all-hideouts-found', () => {
	return unlockAchievement('ALL_HIDEOUTS_FOUND');
});

ipcMain.handle('steam-guestbook-signed', () => {
	return unlockAchievement('GUESTBOOK_SIGNED');
});

ipcMain.handle('steam-unnecessary-fear', () => {
	return unlockAchievement('UNNECESSARY_FEAR');
});

ipcMain.handle('steam-reset-achievement', (event, achievementId) => {
	if (steamClient) {
		try {
			if (steamClient.achievement && steamClient.achievement.clear) {
				steamClient.achievement.clear(achievementId);
				if (steamClient.runCallbacks) {
					steamClient.runCallbacks();
				}
				return true;
			} else if (steamClient.clearAchievement) {
				steamClient.clearAchievement(achievementId);
				if (steamClient.runCallbacks) {
					steamClient.runCallbacks();
				}
				return true;
			} else {
				console.warn('No reset methods found in steam client');
				return false;
			}
		} catch (error) {
			console.error('Failed to reset achievement:', error);
			return false;
		}
	}
	return false;
});

ipcMain.handle('toggle-fullscreen', () => {
	if (mainWindow) {
		const isFullScreen = mainWindow.isFullScreen();
		mainWindow.setFullScreen(!isFullScreen);
		return !isFullScreen;
	}
	return false;
});

ipcMain.handle('is-fullscreen', () => {
	if (mainWindow) {
		return mainWindow.isFullScreen();
	}
	return false;
});

app.whenReady().then(() => {
	createWindow();

	app.on('activate', function () {
		if (mainWindow === null) {
			createWindow();
		}
	});
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
