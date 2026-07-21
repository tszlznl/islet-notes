import { getAttachmentById, getNotebookById } from '@/core/diary/selectors';
import { localize } from '@/nls';
import { CellListGroup } from '@/mobile/components/CellList';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { usePickNotebookImageFromAlbum } from '@/mobile/hooks/usePickNotebookImageFromAlbum';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { DiarySettings } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useCallback, useState } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatSettingsPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const showDialog = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const { status: membershipStatus } = useMembershipStatus();
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const coverCandidate = notebook?.avatarAttachmentId
    ? getAttachmentById(model, notebook.avatarAttachmentId)
    : undefined;
  const coverAttachment = coverCandidate?.type === 'image' ? coverCandidate : undefined;
  const coverUrl = useAttachmentThumbUrl(coverAttachment, { role: 'avatar' });
  const backgroundCandidate = notebook?.chatBackgroundAttachmentId
    ? getAttachmentById(model, notebook.chatBackgroundAttachmentId)
    : undefined;
  const backgroundAttachment =
    backgroundCandidate?.type === 'image' ? backgroundCandidate : undefined;
  const backgroundUrl = useAttachmentThumbUrl(backgroundAttachment, { role: 'avatar' });
  const handleCoverPickSuccess = useCallback(
    (attachment: { id: string }, pickedNotebookId: string) => {
      diaryService.updateNotebookAvatar(pickedNotebookId, attachment.id);
    },
    [diaryService],
  );
  const coverPicker = usePickNotebookImageFromAlbum({
    notebookId,
    onSuccess: handleCoverPickSuccess,
  });

  if (!notebook || !notebookId) return isDeleting ? null : <Navigate to='/diaries' replace />;

  const confirmDeleteNotebook = () => {
    setIsDeleting(true);
    diaryService.softDeleteNotebook(notebookId);
    navigationService.navigate({ path: '/', replace: true });
  };

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={DiarySettings.page}>
      <PageHeader title={localize('diary.settings', 'Notebook settings')} showBack />
      <main
        className={cx(styles.Page.Content, styles.Cell.GroupStack)}
        data-test-id={DiarySettings.content}
      >
        <CellListGroup
          items={[
            {
              label: localize('diary.name', 'Notebook name'),
              right: { type: 'value', text: notebook.name },
              testId: DiarySettings.name,
              onClick: () => navigationService.navigate({ path: `/diary/${notebookId}/name` }),
            },
            {
              label: localize('diary.cover', 'Notebook cover'),
              right: coverUrl
                ? { type: 'image', url: coverUrl }
                : { type: 'initial', text: notebook.name },
              testId: DiarySettings.avatar,
              disabled: coverPicker.uploading,
              onClick: () => void coverPicker.pick(),
            },
            {
              hide: !membershipStatus.active,
              label: localize('diary.chatBackground', 'Chat background'),
              right: backgroundUrl ? { type: 'image', url: backgroundUrl } : undefined,
              testId: DiarySettings.chatBackground,
              onClick: () =>
                navigationService.navigate({ path: `/diary/${notebookId}/chat-background` }),
            },
          ]}
        />
        <CellListGroup
          items={[
            {
              label: localize('diary.search', 'Find diary content'),
              testId: DiarySettings.search,
              onClick: () => navigationService.navigate({ path: `/diary/${notebookId}/search` }),
            },
            {
              label: localize('diary.export.title', 'Export'),
              testId: DiarySettings.export,
              onClick: () => navigationService.navigate({ path: `/diary/${notebookId}/export` }),
            },
          ]}
        />
        <CellListGroup
          items={[
            {
              type: 'action',
              danger: true,
              label: localize('diary.deleteNotebook', 'Delete notebook'),
              testId: DiarySettings.deleteNotebook,
              onClick: () =>
                showDialog({
                  message: localize(
                    'diary.deleteNotebookConfirm',
                    'Delete this notebook? Entries in it will also be removed.',
                  ),
                  confirmLabel: localize('common.delete', 'Delete'),
                  cancelLabel: localize('common.cancel', 'Cancel'),
                  rootTestId: DiarySettings.deleteConfirm,
                  confirmTestId: DiarySettings.deleteConfirmAction,
                  cancelTestId: DiarySettings.deleteCancel,
                  onConfirm: confirmDeleteNotebook,
                }),
            },
          ]}
        />
      </main>
    </div>
  );
}
