import { useCallback, useEffect } from 'react';
import useGame from './useGame';
import useJoysticksStore from './useJoysticks';

const useTouchControls = () => {
	const isMobile = useGame((state) => state.isMobile);
	const setIsMobile = useGame((state) => state.setIsMobile);
	const setIsLocked = useGame((state) => state.setIsLocked);
	const { controls, setControls } = useJoysticksStore();

	useEffect(() => {
		const checkMobile = () => {
			const mobile =
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				);
			setIsMobile(mobile);
			setIsLocked(true);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, [setIsMobile]);

	const handleJoystickMove = useCallback(
		(event, data) => {
			const { direction } = data;
			setControls({
				left: direction.left,
				right: direction.right,
				forward: direction.up,
				backward: direction.down,
			});
		},
		[setControls]
	);

	const handleButtonPress = useCallback(
		(button, pressed) => {
			setControls({ [button]: pressed });
		},
		[setControls]
	);

	return {
		controls,
		isMobile,
		handleJoystickMove,
		handleButtonPress,
	};
};

export default useTouchControls;
