import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { DisplaySettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function SettingsDisplayPage() {
  const navigationService = useService(INavigationService);

  return (
    <HeaderPage
      pageTestId={DisplaySettings.page}
      contentTestId={DisplaySettings.content}
      header={{ title: localize('settings.display', 'Display settings'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            label: localize('settings.theme', 'Theme'),
            testId: DisplaySettings.theme,
            onClick: () => navigationService.navigate({ path: '/settings/theme' }),
          },
          {
            label: localize('settings.calendar', 'Calendar'),
            testId: DisplaySettings.calendar,
            onClick: () => navigationService.navigate({ path: '/settings/display/calendar' }),
          },
        ]}
      />
    </HeaderPage>
  );
}
