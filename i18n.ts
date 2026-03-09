import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ua from './locales/ua.json';
import es from './locales/es.json';

const SUPPORTED_LANGUAGES = ['en', 'ua', 'es'] as const;

function normalizeLanguageCode(language: string | null | undefined) {
  if (!language) return 'en';

  const normalizedLanguage = language.toLowerCase();
  if (normalizedLanguage === 'uk') return 'ua';

  return SUPPORTED_LANGUAGES.includes(normalizedLanguage as (typeof SUPPORTED_LANGUAGES)[number])
    ? normalizedLanguage
    : 'en';
}

const resources = {
  en: { translation: en },
  ua: { translation: ua },
  es: { translation: es },
};

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          return callback(normalizeLanguageCode(language));
        } else {
          const locales = Localization.getLocales();
          const bestLanguage = locales.length > 0 ? locales[0].languageTag : null;
          if (bestLanguage) {
            const langCode = bestLanguage.split('-')[0];
            return callback(normalizeLanguageCode(langCode));
           }
          return callback(normalizeLanguageCode('en'));
        }
      });
    } catch (error) {
      console.log('Error reading language', error);
      return callback(normalizeLanguageCode('en'));
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, normalizeLanguageCode(language));
    } catch (error) {}
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin as any)
  .init({
    resources,
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
