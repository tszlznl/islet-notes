import { enUS, zhCN } from 'date-fns/locale';

export const languageOptions = [
  {
    label: 'Follow System',
    value: 'auto',
  },
  {
    label: 'English',
    value: 'en-US',
  },
  {
    label: '简体中文',
    value: 'zh-CN',
  },
] as const;

const locales = {
  'en-US': ['en-US', 'en'],
  'zh-CN': ['zh-CN', 'zh'],
} as const;

export function getDateFnsLocale(locale = getCurrentLocale()) {
  if (locale === 'zh-CN') {
    return zhCN;
  }
  return enUS;
}

export function getCurrentLocale(): string {
  if (globalThis.language && locales[globalThis.language as keyof typeof locales]) {
    return globalThis.language;
  }
  return 'en-US';
}

export function getValidLocaleKey(configLanguage: string) {
  let finalLocale = 'en-US';
  Object.keys(locales).forEach((key) => {
    const alias = locales[key as keyof typeof locales];
    if ((alias as readonly string[]).includes(configLanguage)) {
      finalLocale = key;
    }
  });

  return finalLocale;
}
