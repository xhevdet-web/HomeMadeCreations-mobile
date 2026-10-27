import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translationEN } from '@/translations/translation-en';
import { translationAL } from '@/translations/translation-al';

/** Supported app languages (ISO 639-1: Albanian is `sq`). */
export const LANGUAGES = ['en', 'sq'] as const;
export type AppLanguage = (typeof LANGUAGES)[number];
export const isAppLanguage = (value: unknown): value is AppLanguage =>
  LANGUAGES.includes(value as AppLanguage);

// The one i18next instance of the app. Resources are bundled, so it is ready synchronously;
// the saved language is applied when the language store is restored (before first render).
const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translationEN },
    sq: { translation: translationAL },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...LANGUAGES],
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Locale for formatting dates in the current language, e.g. 27 October 2026 / 27 tetor 2026. */
export const dateLocale = (language: string) => (language === 'sq' ? 'sq-AL' : 'en-GB');

export default i18n;
