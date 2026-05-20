import { useGLTF as useGLTFDrei } from '@react-three/drei';

const isFileProtocol =
	typeof window !== 'undefined' && window.location?.protocol === 'file:';
const isElectron =
	!!(typeof process !== 'undefined' && process?.versions?.electron) ||
	isFileProtocol;

const DRACO_PATH = isElectron ? 'draco/' : '/draco/';

export function useGLTF(path, _useDraco, useMeshOpt, extendLoader) {
	return useGLTFDrei(path, DRACO_PATH, useMeshOpt, extendLoader);
}

useGLTF.preload = (path, _useDraco, useMeshOpt, extendLoader) =>
	useGLTFDrei.preload(path, DRACO_PATH, useMeshOpt, extendLoader);
useGLTF.clear = useGLTFDrei.clear;

export default useGLTF;
