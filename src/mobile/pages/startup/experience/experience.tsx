import { useService } from '@/hooks/use-service';
import { enterExperienceMode } from '@/mobile/utils/experienceMode';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { styles } from '@/mobile/styles/ui';
import { Startup } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function StartupExperiencePage() {
  const navigationService = useService(INavigationService);

  return (
    <HeaderLayoutPage
      rootClassName={styles.StartupExperiencePage.Root}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={Startup.page}
      contentTestId={Startup.content}
      header={{ tone: 'surface', showBack: true }}
    >
      <FormPage
        title={localize('startup.experience.confirmTitle', 'Enter experience mode?')}
        description={localize(
          'startup.experience.confirmDesc',
          'Experience mode keeps data only in memory. Refreshing, closing the app, or changing language will clear it.',
        )}
        actions={[
          {
            label: localize('startup.experience.enter', 'Enter experience mode'),
            testId: Startup.experienceConfirmAction,
            onClick: () => {
              enterExperienceMode();
              window.location.replace('/');
            },
          },
          {
            label: localize('common.cancel', 'Cancel'),
            variant: 'default',
            testId: Startup.experienceCancel,
            onClick: () => navigationService.navigate({ path: '/startup', replace: true }),
          },
        ]}
      />
    </HeaderLayoutPage>
  );
}
