import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { AISettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { useService } from '@/hooks/use-service';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function SettingsAIPage() {
  const navigationService = useService(INavigationService);

  return (
    <HeaderPage
      pageTestId={AISettings.page}
      contentTestId={AISettings.content}
      header={{ title: localize('settings.ai', 'AI'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            label: localize('settings.speechRecognition.short', 'Voice to text'),
            testId: AISettings.speechRecognition,
            onClick: () => navigationService.navigate({ path: '/settings/speech-recognition' }),
          },
        ]}
      />
    </HeaderPage>
  );
}
