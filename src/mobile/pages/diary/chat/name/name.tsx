import { getNotebookById } from '@/core/diary/selectors';
import { localize } from '@/nls';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { TextInputRow } from '@/mobile/components/TextInputRow';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { DiaryName } from '@/mobile/test.id';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatNamePage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const showSuccessToast = useSuccessToast();
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const [name, setName] = useState(notebook?.name ?? '');
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && notebookId;

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;

  return (
    <HeaderPage
      pageTestId={DiaryName.page}
      contentTestId={DiaryName.content}
      header={{
        title: localize('diary.name', 'Notebook name'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          disabled: !canSave,
          testId: DiaryName.save,
          onClick: () => {
            try {
              diaryService.updateNotebookName(notebookId, trimmedName);
            } catch {
              showSuccessToast({
                message: localize(
                  'diary.name.duplicate',
                  'A notebook with this name already exists',
                ),
                icon: 'none',
                testId: DiaryName.duplicateToast,
              });
              return;
            }
            navigationService.goBack();
          },
        },
      }}
    >
      <TextInputRow
        id='notebookName'
        testId={DiaryName.nameInput}
        autoFocus
        placeholder={localize('diary.name', 'Notebook name')}
        value={name}
        onChange={setName}
      />
    </HeaderPage>
  );
}
