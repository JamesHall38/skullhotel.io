/* eslint-disable no-undef */
const { app, BrowserWindow, protocol, Menu } = require('electron');
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

try {
	steamworks = require('steamworks.js');
	steamworks.electronEnableSteamOverlay(true);
	steamworks.init(3739730);
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

	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
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
		},
		autoHideMenuBar: true,
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
				{
					label: 'Exit Fullscreen',
					accelerator: 'Escape',
					click: () => {
						if (mainWindow.isFullScreen()) {
							mainWindow.setFullScreen(false);
						}
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
	});

	mainWindow.on('leave-full-screen', () => {
		mainWindow.setAutoHideMenuBar(true);
		mainWindow.setMenuBarVisibility(false);
	});

	const indexPath = path.join(getBasePath(), 'index.html');

	const startUrl = `file://${indexPath}`;

	mainWindow.loadURL(startUrl);

	if (!isPackaged) {
		mainWindow.webContents.openDevTools();
	}

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}

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
