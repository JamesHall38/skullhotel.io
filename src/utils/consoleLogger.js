const logs = [];

const addLog = (message) => {
	if (typeof message === 'object') {
		try {
			message = JSON.stringify(message);
		} catch (e) {
			message = String(message);
		}
	}
	logs.push(String(message));
};

const captureFileError = (url) => {
	if (url && url.startsWith('file:///')) {
		addLog(`GET ${url} net::ERR_FILE_NOT_FOUND`);
	}
};

const originalConsole = {
	log: console.log,
	error: console.error,
	warn: console.warn,
	info: console.info,
	debug: console.debug,
};

Object.keys(originalConsole).forEach((method) => {
	console[method] = (...args) => {
		const message = args
			.map((arg) => {
				try {
					return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
				} catch (e) {
					return String(arg);
				}
			})
			.join(' ');

		if (method === 'error' || message.includes('ERR_FILE_NOT_FOUND')) {
			addLog(`[CONSOLE ${method.toUpperCase()}] ${message}`);

			const match = message.match(/file:\/\/\/[^\s")]+/);
			if (match) {
				captureFileError(match[0]);
			}
		}
		originalConsole[method].apply(console, args);
	};
});

window.onerror = function (message, source, lineno, colno, error) {
	addLog(`[GLOBAL ERROR] ${message}`);
	if (source && source.startsWith('file:///')) {
		captureFileError(source);
	}
};

window.onunhandledrejection = function (event) {
	addLog(`[PROMISE ERROR] ${event.reason}`);
};

window.addEventListener(
	'error',
	function (event) {
		if (
			event.target &&
			(event.target.tagName === 'VIDEO' ||
				event.target.tagName === 'IMG' ||
				event.target.tagName === 'SCRIPT')
		) {
			const url = event.target.src || event.target.href;
			if (url) {
				captureFileError(url);
			}
		}
	},
	true
);

const originalFetch = window.fetch;
window.fetch = async function (...args) {
	const url = args[0] instanceof Request ? args[0].url : String(args[0]);
	try {
		const response = await originalFetch.apply(this, args);
		if (!response.ok) {
			captureFileError(url);
		}
		return response;
	} catch (error) {
		captureFileError(url);
		throw error;
	}
};

const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
	const xhr = new originalXHR();
	const originalOpen = xhr.open;
	xhr.open = function (...args) {
		const url = args[1];
		xhr.addEventListener('error', () => {
			captureFileError(url);
		});
		xhr.addEventListener('load', () => {
			if (xhr.status >= 400) {
				captureFileError(url);
			}
		});
		return originalOpen.apply(xhr, args);
	};
	return xhr;
};

const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (node.tagName === 'VIDEO') {
				node.addEventListener('error', (event) => {
					captureFileError(node.src);
				});
			}
		});
	});
});

observer.observe(document, { childList: true, subtree: true });

window.addEventListener('load', () => {
	document.querySelectorAll('video, img, script').forEach((element) => {
		if (!element.complete || element.naturalWidth === 0) {
			captureFileError(element.src);
		}
	});
});

export const getConsoleMessages = () => {
	const consoleOutput = document.querySelector(
		'div[class*="console-"]'
	)?.textContent;
	if (consoleOutput) {
		const matches = consoleOutput.match(/file:\/\/\/[^\s")]+/g) || [];
		matches.forEach((url) => {
			captureFileError(url);
		});
	}

	return [...new Set(logs)];
};

export const clearConsoleMessages = () => {
	logs.length = 0;
};
