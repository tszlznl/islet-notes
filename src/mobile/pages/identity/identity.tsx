import { getIdentityAvatarAttachment, getIdentityById } from '@/core/diary/selectors';
import { IDENTITY_ATTACHMENT_NOTEBOOK_ID } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { usePickNotebookImageFromAlbum } from '@/mobile/hooks/usePickNotebookImageFromAlbum';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { cx, styles } from '@/mobile/styles/ui';
import { IdentityEdit } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useCallback } from 'react';
import { Navigate, useParams } from 'react-router';

export function IdentityPage() {
  const { identityId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const showDialog = useDialog();
  const identity = identityId ? getIdentityById(model, identityId) : undefined;
  const avatarCandidate = getIdentityAvatarAttachment(model, identity);
  const avatarAttachment = avatarCandidate?.type === 'image' ? avatarCandidate : undefined;
  const avatarUrl = useAttachmentThumbUrl(avatarAttachment, { role: 'avatar' });
  const handleAvatarPickSuccess = useCallback(
    (attachment: { id: string }) => {
      if (!identityId) return;
      diaryService.updateIdentityAvatar(identityId, attachment.id);
    },
    [diaryService, identityId],
  );
  const avatarPicker = usePickNotebookImageFromAlbum({
    // 身份头像附件统一挂在固定的 identity 记账 id 下，与 profile 头像同模式。
    notebookId: IDENTITY_ATTACHMENT_NOTEBOOK_ID,
    onSuccess: handleAvatarPickSuccess,
  });

  if (!identity || !identityId) {
    return <Navigate to='/identities' replace />;
  }

  const archived = !!identity.archivedAt;

  const confirmArchive = () => {
    diaryService.archiveIdentity(identityId);
    navigationService.navigate({ path: '/identities', replace: true });
  };

  const unarchive = () => {
    diaryService.unarchiveIdentity(identityId);
    navigationService.navigate({ path: '/identities', replace: true });
  };

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={IdentityEdit.page}>
      <PageHeader title={localize('identity.editTitle', 'Identity details')} showBack />
      <main
        className={cx(styles.Page.Content, styles.Cell.GroupStack)}
        data-test-id={IdentityEdit.content}
      >
        <CellListGroup
          items={[
            {
              label: localize('identity.name', 'Nickname'),
              right: { type: 'value', text: identity.name },
              testId: IdentityEdit.name,
              onClick: () => navigationService.navigate({ path: `/identity/${identityId}/name` }),
            },
            {
              label: localize('identity.avatar', 'Avatar'),
              right: avatarUrl
                ? { type: 'image', url: avatarUrl }
                : { type: 'initial', text: identity.name },
              testId: IdentityEdit.avatar,
              disabled: avatarPicker.uploading,
              onClick: () => void avatarPicker.pick(),
            },
            {
              label: localize('messageColor.title', 'Message color'),
              testId: IdentityEdit.messageColor,
              onClick: () =>
                navigationService.navigate({ path: `/identity/${identityId}/message-color` }),
            },
          ]}
        />
        <CellListGroup
          title={localize('identity.messagePosition', 'Message position')}
          items={[
            {
              type: 'option',
              label: localize('identity.messagePositionLeft', 'Left'),
              selected: identity.messagePosition === 'left',
              testId: IdentityEdit.positionLeft,
              onClick: () => diaryService.updateIdentityMessagePosition(identityId, 'left'),
            },
            {
              type: 'option',
              label: localize('identity.messagePositionRight', 'Right'),
              selected: identity.messagePosition === 'right',
              testId: IdentityEdit.positionRight,
              onClick: () => diaryService.updateIdentityMessagePosition(identityId, 'right'),
            },
          ]}
        />
        <CellListGroup
          items={[
            archived
              ? {
                  type: 'action',
                  label: localize('identity.unarchive', 'Unarchive'),
                  testId: IdentityEdit.unarchive,
                  onClick: unarchive,
                }
              : {
                  type: 'action',
                  label: localize('identity.archive', 'Archive'),
                  testId: IdentityEdit.archive,
                  onClick: () =>
                    showDialog({
                      message: localize(
                        'identity.archiveConfirm',
                        'Archive this identity? It can no longer be selected in chat; existing entries are unaffected.',
                      ),
                      confirmLabel: localize('identity.archive', 'Archive'),
                      cancelLabel: localize('common.cancel', 'Cancel'),
                      rootTestId: IdentityEdit.archiveConfirm,
                      confirmTestId: IdentityEdit.archiveConfirmAction,
                      cancelTestId: IdentityEdit.archiveCancel,
                      onConfirm: confirmArchive,
                    }),
                },
          ]}
        />
      </main>
    </div>
  );
}
