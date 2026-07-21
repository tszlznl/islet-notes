import { buildNotebookTextExport } from '@/core/diary/textExport';
import { getNotebookById } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { DiaryExport } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatExportPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const hostService = useService(IHostService);
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const [exporting, setExporting] = useState(false);
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;

  const exportAllText = async () => {
    const result = buildNotebookTextExport(model, notebookId);
    if (!result || result.entryCount === 0) {
      showSuccessToast({
        message: localize('diary.export.empty', 'No text to export'),
        icon: 'none',
        testId: DiaryExport.failureToast,
      });
      return;
    }

    setExporting(true);
    const loadingToast = showLoadingToast({
      message: localize('diary.export.exporting', 'Preparing export...'),
    });
    try {
      await hostService.exportTextFile({
        filename: result.filename,
        text: result.text,
        mimeType: 'text/plain;charset=utf-8',
      });
      showSuccessToast({
        message: localize('diary.export.done', 'Export ready'),
        testId: DiaryExport.successToast,
      });
    } catch {
      showSuccessToast({
        message: localize('diary.export.failed', 'Could not export text'),
        icon: 'none',
        testId: DiaryExport.failureToast,
      });
    } finally {
      loadingToast.dispose();
      setExporting(false);
    }
  };

  return (
    <HeaderPage
      pageTestId={DiaryExport.page}
      contentTestId={DiaryExport.content}
      header={{ title: localize('diary.export.title', 'Export'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            type: 'action',
            label: localize('diary.export.allText', 'Export all text'),
            testId: DiaryExport.allText,
            onClick: () => void exportAllText(),
            disabled: exporting,
          },
        ]}
      />
    </HeaderPage>
  );
}
