import { useMemo } from 'react';
import useSettings from './useSettings';
import { getPositionalSoundConfig } from '../utils/audio';

export default function usePositionalSound(soundName) {
	const masterVolume = useSettings((state) => state.masterVolume);

	return useMemo(() => {
		const config = getPositionalSoundConfig(soundName);
		if (!config.url) return config;

		return {
			...config,
			volume: (config.baseVolume || 0.5) * masterVolume,
		};
	}, [soundName, masterVolume]);
}
