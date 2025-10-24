import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const detectBrowserLanguage = () => {
	try {
		const oldLanguageStorage = localStorage.getItem('skull-hotel-language');
		if (oldLanguageStorage) {
			const parsed = JSON.parse(oldLanguageStorage);
			if (parsed?.state?.currentLanguage) {
				localStorage.removeItem('skull-hotel-language');
				return parsed.state.currentLanguage;
			}
		}
	} catch (e) {}

	const browserLang = navigator.language || navigator.languages[0];
	const langCode = browserLang.split('-')[0];

	const supportedLanguages = [
		'en',
		'zh',
		'ru',
		'es',
		'pt',
		'de',
		'ja',
		'fr',
		'ko',
		'tr',
		'pl',
		'it',
		'cs',
		'hu',
		'th',
		'uk',
		'nl',
		'sv',
		'da',
		'fi',
		'no',
		'ro',
		'bg',
		'el',
		'ar',
	];

	if (supportedLanguages.includes(langCode)) {
		return langCode;
	}

	return 'en';
};

const useSettings = create(
	persist(
		(set) => ({
			horizontalSensitivity: 0.15,
			setHorizontalSensitivity: (value) =>
				set({ horizontalSensitivity: value }),
			verticalSensitivity: 0.15,
			setVerticalSensitivity: (value) => set({ verticalSensitivity: value }),
			rotationSensitivity: 0.15,
			setRotationSensitivity: (value) =>
				set({
					rotationSensitivity: value,
					horizontalSensitivity: value,
					verticalSensitivity: value,
				}),
			shadows: true,
			setShadows: (value) => set({ shadows: value }),
			masterVolume: 1.0,
			setMasterVolume: (value) => set({ masterVolume: value }),
			currentLanguage: detectBrowserLanguage(),
			setCurrentLanguage: (value) => set({ currentLanguage: value }),
		}),
		{
			name: 'skull-hotel-settings',
			partialize: (state) => ({
				horizontalSensitivity: state.horizontalSensitivity,
				verticalSensitivity: state.verticalSensitivity,
				rotationSensitivity: state.rotationSensitivity,
				shadows: state.shadows,
				masterVolume: state.masterVolume,
				currentLanguage: state.currentLanguage,
			}),
		}
	)
);

export default useSettings;
