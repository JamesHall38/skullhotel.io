import { forwardRef } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const VolumeAwarePositionalAudio = forwardRef((props, ref) => {
	const { volume, ...otherProps } = props;

	useFrame(() => {
		if (ref?.current?.gain?.gain) {
			const targetVolume = volume !== undefined ? volume : 0.5;
			ref.current.gain.gain.value = Math.min(1, Math.max(0, targetVolume));
		}
	});

	return <PositionalAudio ref={ref} {...otherProps} />;
});

VolumeAwarePositionalAudio.displayName = 'VolumeAwarePositionalAudio';

export default VolumeAwarePositionalAudio;
