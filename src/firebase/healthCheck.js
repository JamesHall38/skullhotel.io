import { db } from './config';
import { collection, query, limit, getDocsFromServer } from 'firebase/firestore';

const PROBE_TIMEOUT_MS = 5000;
const PROBE_COLLECTION = 'guestbook';

let cachedResult = null;
let pendingProbe = null;

export const probeFirestoreReachability = () => {
	if (cachedResult !== null) {
		return Promise.resolve(cachedResult);
	}
	if (pendingProbe) {
		return pendingProbe;
	}

	const probe = (async () => {
		try {
			const q = query(collection(db, PROBE_COLLECTION), limit(1));
			const timeout = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('firestore-probe-timeout')), PROBE_TIMEOUT_MS)
			);
			await Promise.race([getDocsFromServer(q), timeout]);
			cachedResult = true;
		} catch {
			cachedResult = false;
		}
		return cachedResult;
	})();

	pendingProbe = probe;
	return probe;
};
