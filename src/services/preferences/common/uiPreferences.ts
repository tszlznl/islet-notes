import { z } from 'zod';
import { definePreference } from './preference';

export const ThemePreferenceSchema = z.enum(['auto', 'light', 'dark']);
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;
export const ThemePreferenceDefinition = definePreference({
  channel: 'localStorage',
  key: 'theme',
  schema: ThemePreferenceSchema,
  defaultValue: 'auto',
});

export const LanguagePreferenceSchema = z.enum(['auto', 'en-US', 'zh-CN']);
export type LanguagePreference = z.infer<typeof LanguagePreferenceSchema>;
export const LanguagePreferenceDefinition = definePreference({
  channel: 'localStorage',
  key: 'language',
  schema: LanguagePreferenceSchema,
  defaultValue: 'auto',
});
