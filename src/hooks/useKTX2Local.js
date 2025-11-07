import { useLoader, useThree } from '@react-three/fiber';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

export default function useKTX2Local(url) {
	const gl = useThree((state) => state.gl);
	return useLoader(KTX2Loader, url, (loader) => {
		loader.setTranscoderPath('basis/');
		loader.detectSupport(gl);
	});
}
