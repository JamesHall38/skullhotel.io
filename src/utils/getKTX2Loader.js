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
		sharedLoader.setTranscoderPath('basis/');
	}
	if (typeof sharedLoader.setWorkerLimit === 'function') {
		sharedLoader.setWorkerLimit(2);
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
