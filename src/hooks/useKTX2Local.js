import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { getKTX2Loader } from '@/utils/getKTX2Loader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const resourceCache = new Map();

// Serialize KTX2 loads to avoid Chromium worker ArrayBuffer detach races
let ktx2Queue = Promise.resolve();
const enqueueKTX2 = (task) => {
	ktx2Queue = ktx2Queue.then(() => task());
	return ktx2Queue;
};

export default function useKTX2Local(url) {
	const gl = useThree((state) => state.gl);
	const loader = useMemo(() => getKTX2Loader(gl), [gl]);

	if (!url) return null;

	let entry = resourceCache.get(url);
	if (!entry) {
		entry = { status: 'pending', promise: null, value: null, error: null };
		entry.promise = enqueueKTX2(
			() =>
				new Promise((resolve, reject) => {
					let retried = false;

					const tryLoad = (activeLoader) => {
						activeLoader.load(
							url,
							(tex) => {
								entry.status = 'success';
								entry.value = tex;
								resolve(tex);
							},
							undefined,
							(err) => {
								const message = String(err?.message || err || '');
								if (!retried && message.includes('already detached')) {
									// One-time retry with a fresh loader instance
									retried = true;
									const fresh = new KTX2Loader();
									try {
										// Mirror configuration from shared loader
										if (typeof fresh.setTranscoderPath === 'function') {
											const isElectron = !!(
												typeof process !== 'undefined' &&
												process?.versions?.electron
											);
											fresh.setTranscoderPath(
												isElectron ? 'basis/' : '/basis/'
											);
										}
										if (typeof fresh.setWorkerLimit === 'function') {
											fresh.setWorkerLimit(1);
										}
										if (gl && typeof fresh.detectSupport === 'function') {
											fresh.detectSupport(gl);
										}
									} catch (_e) {}
									// Re-enqueue retry to keep strict serialization
									return enqueueKTX2(() => tryLoad(fresh));
								}
								entry.status = 'error';
								entry.error = err || new Error('Failed to load texture');
								reject(entry.error);
							}
						);
					};

					tryLoad(loader);
				})
		);
		resourceCache.set(url, entry);
	}

	if (entry.status === 'pending') throw entry.promise;
	if (entry.status === 'error') throw entry.error;
	return entry.value;
}
