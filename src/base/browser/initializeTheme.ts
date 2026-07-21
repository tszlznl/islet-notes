import {
  ThemePreferenceDefinition,
  type ThemePreference,
} from '@/services/preferences/common/uiPreferences';

export type { ThemePreference } from '@/services/preferences/common/uiPreferences';
export type ResolvedTheme = 'light' | 'dark';

export const themePreferenceChangeEvent = 'islet:theme-preference-change';

export function getThemePreference(): ThemePreference {
  const result = ThemePreferenceDefinition.schema.safeParse(
    localStorage.getItem(ThemePreferenceDefinition.key),
  );
  return result.success ? result.data : ThemePreferenceDefinition.defaultValue;
}

export function getResolvedTheme(): ResolvedTheme {
  const savedTheme = getThemePreference();
  if (savedTheme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return savedTheme;
}

export function setResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

export function initializeTheme() {
  setResolvedTheme(getResolvedTheme());
}

export function applyThemePreference() {
  initializeTheme();
  window.dispatchEvent(new Event(themePreferenceChangeEvent));
}
