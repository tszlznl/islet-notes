import {
  formatEntryTime,
  getEntryDisplayTime,
  getEntrySummary,
  getFutureEntries,
  getIdentityById,
  getNotebookById,
} from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { MembershipSettings } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { Trash2 } from 'lucide-react';
import React from 'react';

/** 查看时光机写给未来的消息，按展示时间从近到远排列；不区分会员，均可查看和删除。 */
export function SettingsMembershipFutureMessagesPage() {
  const diaryService = useService(IDiaryService);
  const model = useDiaryModel();
  const showDialog = useDialog();
  const showSuccessToast = useSuccessToast();

  const confirmDelete = (entryId: string) => {
    showDialog({
      title: localize('settings.membership.futureMessages.delete', 'Delete future message'),
      message: localize(
        'settings.membership.futureMessages.deleteConfirm',
        'Deleted messages cannot be restored.',
      ),
      confirmLabel: localize('common.delete', 'Delete'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      tone: 'danger',
      rootTestId: MembershipSettings.futureMessagesDeleteDialog,
      confirmTestId: MembershipSettings.futureMessagesDeleteConfirm,
      cancelTestId: MembershipSettings.futureMessagesDeleteCancel,
      onConfirm: () => {
        diaryService.softDeleteEntry(entryId);
        showSuccessToast({ message: localize('diary.entryDeleted', 'Deleted') });
      },
    });
  };

  const entries = getFutureEntries(model);

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.GroupedRoot}
      contentClassName={styles.Membership.PageContent}
      pageTestId={MembershipSettings.futureMessagesPage}
      contentTestId={MembershipSettings.futureMessagesContent}
      header={{
        title: localize('settings.membership.futureMessages', 'Future messages'),
        showBack: true,
      }}
    >
      {entries.length === 0 ? (
        <p
          className={styles.Membership.FutureMessagesEmpty}
          data-test-id={MembershipSettings.futureMessagesEmpty}
        >
          {localize('settings.membership.futureMessages.empty', 'No future messages yet')}
        </p>
      ) : (
        <div className={styles.Membership.FutureMessageList}>
          {entries.map((entry) => {
            const notebook = getNotebookById(model, entry.notebookId);
            const identity = entry.identityId
              ? getIdentityById(model, entry.identityId)
              : undefined;
            return (
              <div
                key={entry.id}
                className={styles.Membership.FutureMessageItem}
                data-test-id={MembershipSettings.futureMessagesItem}
              >
                <div className={styles.Membership.FutureMessageBody}>
                  <p className={styles.Membership.FutureMessageSummary}>
                    {getEntrySummary(model, entry)}
                  </p>
                  <p className={styles.Membership.FutureMessageMeta}>
                    <span>{formatEntryTime(getEntryDisplayTime(entry))}</span>
                    {notebook && <span>{notebook.name}</span>}
                    {identity && <span>{identity.name}</span>}
                  </p>
                </div>
                <button
                  className={styles.Membership.FutureMessageDeleteButton}
                  type='button'
                  aria-label={localize(
                    'settings.membership.futureMessages.delete',
                    'Delete future message',
                  )}
                  data-test-id={MembershipSettings.futureMessagesDelete}
                  onClick={() => confirmDelete(entry.id)}
                >
                  <Trash2 size={18} aria-hidden='true' />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </HeaderLayoutPage>
  );
}
