import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { getKTX2Loader } from '@/utils/getKTX2Loader';

const resourceCache = new Map();

export default function useKTX2Local(url) {
	const gl = useThree((state) => state.gl);
	const loader = useMemo(() => getKTX2Loader(gl), [gl]);

	if (!url) return null;

	let entry = resourceCache.get(url);
	if (!entry) {
		entry = { status: 'pending', promise: null, value: null, error: null };
		entry.promise = new Promise((resolve, reject) => {
			loader.load(
				url,
				(tex) => {
					entry.status = 'success';
					entry.value = tex;
					resolve(tex);
				},
				undefined,
				(err) => {
					entry.status = 'error';
					entry.error = err || new Error('Failed to load texture');
					reject(entry.error);
				}
			);
		});
		resourceCache.set(url, entry);
	}

	if (entry.status === 'pending') throw entry.promise;
	if (entry.status === 'error') throw entry.error;
	return entry.value;
}
