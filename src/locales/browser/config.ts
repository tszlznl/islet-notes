import { configMessages } from '../common/messages';
import { LanguagePreferenceDefinition } from '@/services/preferences/common/uiPreferences';

const result = LanguagePreferenceDefinition.schema.safeParse(
  localStorage.getItem(LanguagePreferenceDefinition.key),
);
configMessages(result.success && result.data !== 'auto' ? result.data : navigator.language);
