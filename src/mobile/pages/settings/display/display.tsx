import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { usePreference } from '@/mobile/hooks/usePreference';
import { DisplaySettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import {
  MessageLinkDetectionPreference,
  PageTransitionPreference,
} from '@/services/preferences/common/appPreferences';
import React from 'react';

export function SettingsDisplayPage() {
  const navigationService = useService(INavigationService);
  const [messageLinkDetection, setMessageLinkDetection] = usePreference(
    MessageLinkDetectionPreference,
  );
  const [pageTransition, setPageTransition] = usePreference(PageTransitionPreference);

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
          {
            type: 'switch',
            label: localize('settings.messageLinks', 'Detect links in messages'),
            checked: messageLinkDetection,
            testId: DisplaySettings.messageLinks,
            onChange: (checked) => void setMessageLinkDetection(checked),
          },
          {
            type: 'switch',
            label: localize('settings.pageTransition', 'Page transition animation'),
            checked: pageTransition,
            testId: DisplaySettings.pageTransition,
            onChange: (checked) => void setPageTransition(checked),
          },
        ]}
      />
    </HeaderPage>
  );
}
