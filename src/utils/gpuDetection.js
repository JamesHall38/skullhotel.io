export function checkGPUSupport() {
	try {
		// Check WebGL2 support
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2');

		if (!gl) {
			// Try WebGL1 as fallback to get more info
			const gl1 =
				canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl1) {
				return {
					isSupported: false,
					reason: 'noWebGL',
					gpuInfo: 'WebGL not supported',
				};
			}

			return {
				isSupported: false,
				reason: 'noWebGL2',
				gpuInfo: getGPURenderer(gl1),
			};
		}

		const renderer = getGPURenderer(gl);

		// Check for very old Intel HD Graphics (2000-4000 series)
		const veryOldIntelPatterns = [
			/Intel.*HD Graphics 2000/i,
			/Intel.*HD Graphics 3000/i,
			/Intel.*HD Graphics 4000/i,
			/Intel.*G41/i,
			/Intel.*G45/i,
		];

		// Check for very old NVIDIA/AMD cards
		const veryOldNvidiaPatterns = [
			/GeForce 9[0-9]{3}/i, // GeForce 9000 series
			/GeForce 8[0-9]{3}/i, // GeForce 8000 series
		];

		const isVeryOldIntel = veryOldIntelPatterns.some((pattern) =>
			pattern.test(renderer)
		);
		const isVeryOldNvidia = veryOldNvidiaPatterns.some((pattern) =>
			pattern.test(renderer)
		);

		if (isVeryOldIntel || isVeryOldNvidia) {
			return {
				isSupported: false,
				reason: 'tooOld',
				gpuInfo: renderer,
			};
		}

		return {
			isSupported: true,
			reason: null,
			gpuInfo: renderer,
		};
	} catch (error) {
		return {
			isSupported: false,
			reason: 'unknown',
			gpuInfo: 'Unknown GPU',
		};
	}
}

function getGPURenderer(gl) {
	try {
		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (debugInfo) {
			return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		}
		return gl.getParameter(gl.RENDERER);
	} catch (error) {
		return 'Unknown GPU';
	}
}

export function isWebGLError(error) {
	if (!error) return false;

	const errorString = error.toString().toLowerCase();
	const webglKeywords = [
		'webgl',
		'webgl2',
		'context',
		'renderer',
		'could not create',
		'failed to create',
	];

	return webglKeywords.some((keyword) => errorString.includes(keyword));
}
