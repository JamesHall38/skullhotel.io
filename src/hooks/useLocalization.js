import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';
import ja from '../locales/ja.json';
import fr from '../locales/fr.json';
import ko from '../locales/ko.json';
import tr from '../locales/tr.json';
import pl from '../locales/pl.json';
import it from '../locales/it.json';
import cs from '../locales/cs.json';
import hu from '../locales/hu.json';
import th from '../locales/th.json';
import uk from '../locales/uk.json';
import nl from '../locales/nl.json';
import sv from '../locales/sv.json';
import da from '../locales/da.json';
import fi from '../locales/fi.json';
import no from '../locales/no.json';
import ro from '../locales/ro.json';
import bg from '../locales/bg.json';
import el from '../locales/el.json';
import ar from '../locales/ar.json';

const translations = {
	en,
	zh,
	ru,
	es,
	pt,
	de,
	ja,
	fr,
	ko,
	tr,
	pl,
	it,
	cs,
	hu,
	th,
	uk,
	nl,
	sv,
	da,
	fi,
	no,
	ro,
	bg,
	el,
	ar,
};

export const languages = [
	{ code: 'en', name: 'English', nativeName: 'English' },
	{ code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
	{ code: 'ru', name: 'Russian', nativeName: 'Русский' },
	{ code: 'es', name: 'Spanish', nativeName: 'Español' },
	{
		code: 'pt',
		name: 'Portuguese (Brazilian)',
		nativeName: 'Português (Brasil)',
	},
	{ code: 'de', name: 'German', nativeName: 'Deutsch' },
	{ code: 'ja', name: 'Japanese', nativeName: '日本語' },
	{ code: 'fr', name: 'French', nativeName: 'Français' },
	{ code: 'ko', name: 'Korean', nativeName: '한국어' },
	{ code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
	{ code: 'pl', name: 'Polish', nativeName: 'Polski' },
	{ code: 'it', name: 'Italian', nativeName: 'Italiano' },
	{ code: 'cs', name: 'Czech', nativeName: 'Čeština' },
	{ code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
	{ code: 'th', name: 'Thai', nativeName: 'ไทย' },
	{ code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
	{ code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
	{ code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
	{ code: 'da', name: 'Danish', nativeName: 'Dansk' },
	{ code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
	{ code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
	{ code: 'ro', name: 'Romanian', nativeName: 'Română' },
	{ code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
	{ code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
	{ code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

const detectBrowserLanguage = () => {
	const browserLang = navigator.language || navigator.languages[0];
	const langCode = browserLang.split('-')[0];

	if (translations[langCode]) {
		return langCode;
	}

	return 'en';
};

const useLocalization = create(
	persist(
		(set, get) => ({
			currentLanguage: detectBrowserLanguage(),

			setLanguage: (languageCode) => {
				if (translations[languageCode]) {
					set({ currentLanguage: languageCode });
				}
			},

			getCurrentLanguage: () => {
				return get().currentLanguage;
			},

			t: (key, params = {}) => {
				const currentLanguage = get().currentLanguage;
				const translation = translations[currentLanguage];

				if (!translation) {
					console.warn(
						`Translation not found for language: ${currentLanguage}`
					);
					return key;
				}

				const keys = key.split('.');
				let value = translation;

				for (const k of keys) {
					if (value && typeof value === 'object' && k in value) {
						value = value[k];
					} else {
						console.warn(
							`Translation key not found: ${key} in ${currentLanguage}`
						);
						return key;
					}
				}

				if (typeof value === 'string' && Object.keys(params).length > 0) {
					return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
						return params[paramKey] !== undefined ? params[paramKey] : match;
					});
				}

				return value;
			},

			getLanguageName: (code) => {
				const lang = languages.find((l) => l.code === code);
				return lang ? lang.nativeName : code;
			},
		}),
		{
			name: 'skull-hotel-language',
			partialize: (state) => ({ currentLanguage: state.currentLanguage }),
		}
	)
);

export default useLocalization;
