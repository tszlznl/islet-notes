import { localize } from '@/nls';
import { languageOptions } from '@/locales/common/locale';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { usePreference } from '@/mobile/hooks/usePreference';
import { LanguageSettings } from '@/mobile/test.id';
import {
  LanguagePreferenceDefinition,
  type LanguagePreference,
} from '@/services/preferences/common/uiPreferences';
import React from 'react';

const languageTestIds: Record<LanguagePreference, string> = {
  auto: LanguageSettings.option,
  'en-US': LanguageSettings.english,
  'zh-CN': LanguageSettings.chinese,
};

const options = languageOptions.map((option) => ({
  ...option,
  label:
    option.value === 'auto' ? localize('settings.followSystem', 'Follow system') : option.label,
  testId: languageTestIds[option.value],
}));

export function SettingsLanguagePage() {
  const [language, setLanguage] = usePreference(LanguagePreferenceDefinition, {
    onSave: () => window.location.reload(),
  });

  return (
    <HeaderPage
      pageTestId={LanguageSettings.page}
      contentTestId={LanguageSettings.content}
      header={{
        title: localize('settings.language', 'Language'),
        showBack: true,
      }}
    >
      <CellListGroup
        items={options.map((option) => ({
          type: 'option' as const,
          key: option.value,
          label: option.label,
          selected: language === option.value,
          testId: option.testId,
          onClick: () => void setLanguage(option.value === 'auto' ? undefined : option.value),
        }))}
      />
    </HeaderPage>
  );
}
