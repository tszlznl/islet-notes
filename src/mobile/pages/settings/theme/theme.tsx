import { applyThemePreference, ThemePreference } from '@/base/browser/initializeTheme';
import { localize } from '@/nls';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { usePreference } from '@/mobile/hooks/usePreference';
import { ThemeSettings } from '@/mobile/test.id';
import { ThemePreferenceDefinition } from '@/services/preferences/common/uiPreferences';
import React from 'react';

const options: Array<{ label: string; value: ThemePreference; testId: string }> = [
  {
    label: localize('settings.followSystem', 'Follow system'),
    value: 'auto',
    testId: ThemeSettings.auto,
  },
  { label: localize('theme.light', 'Light'), value: 'light', testId: ThemeSettings.option },
  { label: localize('theme.dark', 'Dark'), value: 'dark', testId: ThemeSettings.dark },
];

export function SettingsThemePage() {
  const [theme, setTheme] = usePreference(ThemePreferenceDefinition, {
    onSave: applyThemePreference,
  });
  return (
    <HeaderPage
      pageTestId={ThemeSettings.page}
      contentTestId={ThemeSettings.content}
      header={{
        title: localize('settings.theme', 'Theme'),
        showBack: true,
      }}
    >
      <CellListGroup
        items={options.map((option) => ({
          type: 'option' as const,
          key: option.value,
          label: option.label,
          selected: theme === option.value,
          testId: option.testId,
          onClick: () => void setTheme(option.value),
        }))}
      />
    </HeaderPage>
  );
}
