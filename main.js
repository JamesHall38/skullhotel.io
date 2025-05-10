import { app, BrowserWindow, net, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		icon: path.join(__dirname, 'assets', 'icon.ico'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: true,
			allowRunningInsecureContent: false,
		},
	});

	if (isDev) {
		mainWindow.loadURL('http://localhost:3000');
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
	}

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	const checkConnection = () => {
		const isOnline = net.isOnline();
		mainWindow.webContents.send('connection-status', isOnline);
	};

	net.on('online', () => {
		mainWindow.webContents.send('connection-status', true);
	});
	net.on('offline', () => {
		mainWindow.webContents.send('connection-status', false);
	});

	checkConnection();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
