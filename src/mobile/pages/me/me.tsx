import { BottomTabBar } from '@/mobile/components/BottomTabBar';
import { CellListGroup } from '@/mobile/components/CellList';
import { UserAvatar } from '@/mobile/components/UserAvatar';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { styles } from '@/mobile/styles/ui';
import { Settings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { useService } from '@/hooks/use-service';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export function MePage() {
  const navigationService = useService(INavigationService);
  const model = useDiaryModel();
  const displayName = model.profile.name || localize('settings.myNotebook', 'My notebook');
  const entryCount = model.entries.filter((entry) => !entry.deletedAt).length;

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={Settings.page}>
      <main className={styles.MePage.Content} data-test-id={Settings.content}>
        <button
          className={styles.MePage.ProfileButton}
          type='button'
          data-test-id={Settings.profile}
          onClick={() => navigationService.navigate({ path: '/settings/profile' })}
        >
          <UserAvatar size={64} className={styles.Common.AvatarRounded} />
          <span className={styles.MePage.ProfileBody}>
            <span className={styles.MePage.ProfileName}>{displayName}</span>
            <span className={styles.MePage.ProfileMeta}>
              {localize('me.entriesRecorded', '{0} entries recorded', entryCount)}
            </span>
          </span>
          <ChevronRight size={20} strokeWidth={1.75} className={styles.MePage.Chevron} />
        </button>
        <CellListGroup
          items={[
            {
              label: localize('identity.title', 'Identities'),
              testId: Settings.identities,
              onClick: () => navigationService.navigate({ path: '/identities' }),
            },
            {
              label: localize('settings.title', 'Settings'),
              testId: Settings.preferences,
              onClick: () => navigationService.navigate({ path: '/settings' }),
            },
          ]}
        />
      </main>
      <BottomTabBar active='me' />
    </div>
  );
}
