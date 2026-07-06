import { getNotebookById } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { CellListGroup } from '@/mobile/components/CellList';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { usePickNotebookImageFromAlbum } from '@/mobile/hooks/usePickNotebookImageFromAlbum';
import { DiarySettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useCallback } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatBackgroundPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const { status: membershipStatus, isLoading: membershipLoading } = useMembershipStatus();
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;

  const handlePickSuccess = useCallback(
    (attachment: { id: string }, pickedNotebookId: string) => {
      diaryService.updateNotebookChatBackground(pickedNotebookId, attachment.id);
      navigationService.goBack({ fallbackPath: `/diary/${pickedNotebookId}/settings` });
    },
    [diaryService, navigationService],
  );
  const backgroundPicker = usePickNotebookImageFromAlbum({
    notebookId,
    onSuccess: handlePickSuccess,
  });

  const clearBackground = () => {
    if (!notebookId) return;
    diaryService.updateNotebookChatBackground(notebookId, undefined);
    navigationService.goBack({ fallbackPath: `/diary/${notebookId}/settings` });
  };

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;
  if (!membershipStatus.active) {
    return membershipLoading ? null : <Navigate to={`/diary/${notebookId}/settings`} replace />;
  }

  return (
    <HeaderPage
      pageTestId={DiarySettings.chatBackgroundPage}
      contentTestId={DiarySettings.chatBackgroundContent}
      header={{ title: localize('diary.chatBackground', 'Chat background'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            type: 'action',
            label: localize('diary.chatBackground.selectFromAlbum', 'Choose from album'),
            testId: DiarySettings.chatBackgroundSelectAlbum,
            disabled: backgroundPicker.uploading,
            onClick: () => void backgroundPicker.pick(),
          },
          {
            type: 'action',
            label: localize('diary.chatBackground.clear', 'Clear background'),
            testId: DiarySettings.chatBackgroundClear,
            danger: true,
            onClick: clearBackground,
          },
        ]}
      />
    </HeaderPage>
  );
}
