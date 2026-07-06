import { getArchivedIdentities } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { PageHeader } from '@/mobile/components/PageHeader';
import { IdentityItem } from '@/mobile/components/pages/identities/IdentityItem';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { cx, styles } from '@/mobile/styles/ui';
import { IdentityArchived } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export function IdentitiesArchivedPage() {
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const identities = getArchivedIdentities(model);

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={IdentityArchived.page}>
      <PageHeader title={localize('identity.archivedTitle', 'Archived identities')} showBack />
      <main className={styles.Page.Content} data-test-id={IdentityArchived.content}>
        {identities.length > 0 ? (
          <div className={styles.Cell.InsetGroup} data-test-id={IdentityArchived.list}>
            {identities.map((identity) => (
              <IdentityItem
                key={identity.id}
                model={model}
                identity={identity}
                testId={IdentityArchived.item}
                nameTestId={IdentityArchived.itemName}
                onClick={() => navigationService.navigate({ path: `/identity/${identity.id}` })}
                trailing={
                  <ChevronRight size={18} className={styles.CellList.Chevron} strokeWidth={1.9} />
                }
              />
            ))}
          </div>
        ) : (
          <div
            className={cx(styles.Cell.InsetGroup, styles.IdentityListPage.Empty)}
            data-test-id={IdentityArchived.empty}
          >
            {localize('identity.archivedEmpty', 'No archived identities')}
          </div>
        )}
      </main>
    </div>
  );
}
