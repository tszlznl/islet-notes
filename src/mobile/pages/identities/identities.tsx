import { getActiveIdentities, getArchivedIdentities } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { PageHeader } from '@/mobile/components/PageHeader';
import { IdentityItem } from '@/mobile/components/pages/identities/IdentityItem';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { usePreference } from '@/mobile/hooks/usePreference';
import { cx, styles } from '@/mobile/styles/ui';
import { IdentityList } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IdentityConfigPreference } from '@/services/diary/common/identityConfig';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function IdentitiesPage() {
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const identities = getActiveIdentities(model);
  const hasArchived = getArchivedIdentities(model).length > 0;
  const [identityConfig, setIdentityConfig] = usePreference(IdentityConfigPreference);

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={IdentityList.page}>
      <PageHeader
        title={localize('identity.title', 'Identities')}
        showBack
        right={{
          type: 'icon',
          icon: 'plus',
          label: localize('identity.add', 'New identity'),
          testId: IdentityList.add,
          onClick: () => navigationService.navigate({ path: '/identities/new' }),
        }}
      />
      <main
        className={cx(styles.Page.Content, styles.Cell.GroupStack)}
        data-test-id={IdentityList.content}
      >
        <label className={cx(styles.Cell.InsetGroup, styles.IdentityListPage.SwitchRow)}>
          <span className={styles.IdentityListPage.SwitchLabel}>
            {localize('identity.chatEntry', 'Use identities in chat')}
          </span>
          <input
            type='checkbox'
            className={styles.Choice.Input}
            data-test-id={IdentityList.chatEntrySwitch}
            checked={identityConfig.chatEntryEnabled}
            onChange={(event) => void setIdentityConfig({ chatEntryEnabled: event.target.checked })}
          />
        </label>
        <div>
          {identities.length > 0 ? (
            <div className={styles.Cell.InsetGroup} data-test-id={IdentityList.list}>
              {identities.map((identity) => (
                <IdentityItem
                  key={identity.id}
                  model={model}
                  identity={identity}
                  testId={IdentityList.item}
                  nameTestId={IdentityList.itemName}
                  onClick={() => navigationService.navigate({ path: `/identity/${identity.id}` })}
                />
              ))}
            </div>
          ) : (
            <div
              className={cx(styles.Cell.InsetGroup, styles.IdentityListPage.Empty)}
              data-test-id={IdentityList.empty}
            >
              {localize('identity.empty', 'No identities yet. Tap + to add one.')}
            </div>
          )}
          {hasArchived && (
            <button
              className={styles.IdentityListPage.ArchivedLink}
              type='button'
              data-test-id={IdentityList.viewArchived}
              onClick={() => navigationService.navigate({ path: '/identities/archived' })}
            >
              {localize('identity.viewArchived', 'View archived')}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
