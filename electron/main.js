/* eslint-disable no-undef */
const {
	app,
	BrowserWindow,
	protocol,
	Menu,
	ipcMain,
	screen,
	session,
} = require('electron');
const path = require('path');
const fs = require('fs');
const process = require('process');

const compatArg = (process.argv || []).find((a) => a.startsWith('--compat='));
const compatMode = compatArg ? compatArg.split('=')[1] : null;
const isCompatGL = compatMode === 'gl';

app.commandLine.appendSwitch('force_high_performance_gpu');
if (isCompatGL) {
	app.commandLine.appendSwitch('use-angle', 'gl');
	app.commandLine.appendSwitch('disable-direct-composition');
} else {
	app.commandLine.appendSwitch('use-angle', 'd3d11');
}

if (!app.isPackaged) {
	app.commandLine.appendSwitch('ignore-gpu-blocklist');
	app.commandLine.appendSwitch('enable-gpu-rasterization');
	app.commandLine.appendSwitch('enable-zero-copy');
}

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
		const externalBuild = path.join(process.resourcesPath, 'app', 'build');
		const externalMain = path.join(externalBuild, 'assets', 'main.js');

		let appPath = null;
		try {
			appPath = app.getAppPath();
		} catch (e) {}
		const asarBuild = appPath ? path.join(appPath, 'build') : null;
		const asarMain = asarBuild
			? path.join(asarBuild, 'assets', 'main.js')
			: null;

		try {
			if (!fs.existsSync(externalMain) && asarMain && fs.existsSync(asarMain)) {
				fs.mkdirSync(externalBuild, { recursive: true });
				fs.cpSync(asarBuild, externalBuild, { recursive: true, force: true });
			}
		} catch (e) {
			// ignore copy errors; we'll fall back to asar if needed
		}

		if (fs.existsSync(externalMain)) return externalBuild;
		if (asarMain && fs.existsSync(asarMain)) return asarBuild;
		if (fs.existsSync(externalBuild)) return externalBuild;
		if (asarBuild && fs.existsSync(asarBuild)) return asarBuild;
		return externalBuild;
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

	const isAsar = buildDir.includes('app.asar');

	const mainJsPath = path.join(buildDir, 'assets', 'main.js');
	if (fs.existsSync(mainJsPath) && !isAsar) {
		let content = fs.readFileSync(mainJsPath, 'utf8');

		const replacements = [
			{ from: '"/models/', to: '"models/' },
			{ from: "'/models/", to: "'models/" },
			{ from: '"/sounds/', to: '"sounds/' },
			{ from: "'/sounds/", to: "'sounds/" },
			{ from: '"/textures/', to: '"textures/' },
			{ from: "'/textures/", to: "'textures/" },
			{ from: '"/basis/', to: '"basis/' },
			{ from: "'/basis/", to: "'basis/" },
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
	} else if (!fs.existsSync(mainJsPath)) {
		console.error('Could not find main.js at:', mainJsPath);
	}

	const indexHtmlPath = path.join(buildDir, 'index.html');
	if (fs.existsSync(indexHtmlPath) && !isAsar) {
		let content = fs.readFileSync(indexHtmlPath, 'utf8');

		content = content.split('href="/').join('href="');
		content = content.split('src="/').join('src="');
		content = content.split('href="./').join('href="');
		content = content.split('src="./').join('src="');

		fs.writeFileSync(indexHtmlPath, content);
	} else if (!fs.existsSync(indexHtmlPath)) {
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

	if (isCompatGL) {
		mainWindow.webContents.on('did-finish-load', () => {
			console.warn(
				'[COMPAT] Relaunched in GL compatibility mode with DirectComposition disabled.'
			);
		});
	}

	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents.setZoomFactor(1.0);

		mainWindow.webContents
			.executeJavaScript(
				`
			(async () => {
				if (navigator.gpu) {
					const adapter = await navigator.gpu.requestAdapter();
					console.log('🎮 GPU WebGPU:', adapter);
				}
				const canvas = document.createElement('canvas');
				const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
				if (gl) {
					const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
					if (debugInfo) {
						const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
						const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
						console.log('🎮 GPU Detected:', renderer);
						console.log('🏭 GPU Vendor:', vendor);
						
						const gpuInfo = {
							renderer: renderer,
							vendor: vendor,
							isIntelIntegrated: renderer.includes('Intel') && (renderer.includes('UHD') || renderer.includes('Iris')),
							isDiscrete: renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')
						};
						
						if (gpuInfo.isIntelIntegrated) {
							console.warn('⚠️ ATTENTION: Integrated Intel GPU detected! The discrete GPU may not be used.');
							console.warn('⚠️ The user may need to configure manually in Windows settings.');
						} else if (gpuInfo.isDiscrete) {
							console.log('✅ Discrete GPU detected! Optimal performance.');
						}
						
						return gpuInfo;
					}
				}
				return null;
			})();
		`
			)
			.then((gpuInfo) => {
				if (gpuInfo && mainWindow && mainWindow.webContents) {
					mainWindow.webContents.send('gpu-detected', gpuInfo);
				}
			});
	});

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

ipcMain.handle('compat-relaunch', (_event, { mode }) => {
	const nextArgs = (process.argv || [])
		.slice(1)
		.filter((a) => !a.startsWith('--compat='));
	nextArgs.push(`--compat=${mode || 'gl'}`);
	try {
		app.relaunch({ args: nextArgs });
		app.exit(0);
		return true;
	} catch (e) {
		console.error('Failed to relaunch in compat mode:', e);
		return false;
	}
});

app.whenReady().then(() => {
	app
		.getGPUInfo('complete')
		.then((gpuInfo) => {
			console.log('=== GPU INFORMATION ===');
			console.log('GPU Actif:', JSON.stringify(gpuInfo, null, 2));

			const gpuDevices = gpuInfo.gpuDevice || [];
			const hasDiscreteGPU = gpuDevices.some(
				(device) =>
					device.vendorId &&
					(device.vendorId === 4318 || // NVIDIA (0x10DE)
						device.vendorId === 4098 || // AMD (0x1002)
						device.vendorId === 32902) // AMD (0x1022)
			);

			if (hasDiscreteGPU) {
				console.log('✅ Discrete GPU detected');
			} else {
				console.log('⚠️ No discrete GPU detected - using integrated GPU');
			}
			console.log('========================');
		})
		.catch((err) => {
			console.error('Error retrieving GPU information:', err);
		});

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
