import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

let sharedLoader = null;
let didDetectSupport = false;

export function getKTX2Loader(gl) {
	if (sharedLoader) {
		if (
			!didDetectSupport &&
			gl &&
			typeof sharedLoader.detectSupport === 'function'
		) {
			sharedLoader.detectSupport(gl);
			didDetectSupport = true;
		}
		return sharedLoader;
	}

	sharedLoader = new KTX2Loader();
	if (typeof sharedLoader.setTranscoderPath === 'function') {
		const isElectron = !!(
			typeof process !== 'undefined' && process?.versions?.electron
		);
		sharedLoader.setTranscoderPath(isElectron ? 'basis/' : '/basis/');
	}
	if (typeof sharedLoader.setWorkerLimit === 'function') {
		sharedLoader.setWorkerLimit(1);
	}
	if (gl && typeof sharedLoader.detectSupport === 'function') {
		sharedLoader.detectSupport(gl);
		didDetectSupport = true;
	}
	return sharedLoader;
}

export function disposeKTX2Loader() {
	if (sharedLoader && typeof sharedLoader.dispose === 'function') {
		try {
			sharedLoader.dispose();
		} catch (e) {}
	}
	sharedLoader = null;
	didDetectSupport = false;
}
