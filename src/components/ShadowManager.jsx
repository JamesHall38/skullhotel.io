import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useSettings from '../hooks/useSettings';
import useGame from '../hooks/useGame';

export default function ShadowManager() {
	const { gl, scene } = useThree();
	const shadows = useSettings((state) => state.shadows);
	const performanceMode = useGame((state) => state.performanceMode);
	const isMobile = useGame((state) => state.isMobile);

	useEffect(() => {
		if (!shadows) {
			gl.shadowMap.enabled = false;
			gl.shadowMap.autoUpdate = false;
			gl.shadowMap.needsUpdate = false;

			scene.traverse((object) => {
				if (object.isMesh) {
					object.castShadow = false;
					object.receiveShadow = false;
				}
				if (object.isLight) {
					object.castShadow = false;
					if (object.shadow && object.shadow.map) {
						object.shadow.map.dispose();
						object.shadow.map = null;
					}
				}
			});

			gl.setRenderTarget(null);
		} else {
			gl.shadowMap.enabled = true;
			gl.shadowMap.autoUpdate = true;
			gl.shadowMap.needsUpdate = true;

			scene.traverse((object) => {
				if (object.isMesh) {
					object.castShadow = true;
					object.receiveShadow = true;
				}
				if (object.isLight) {
					object.castShadow = true;
				}
			});
		}
	}, [shadows, performanceMode, isMobile, gl, scene]);

	return null;
}
