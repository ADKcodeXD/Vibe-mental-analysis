import type { Locale } from '../i18n-config';

// We enumerate all dictionaries here for better linting and typescript support
// We also use the 'import' function for dynamic loading
const dictionaries = {
  zh: () => import('../messages/zh.json').then((module) => module.default),
  en: () => import('../messages/en.json').then((module) => module.default),
  ja: () => import('../messages/ja.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) =>
  dictionaries[locale]?.() ?? dictionaries.zh();
