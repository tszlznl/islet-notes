import { getNotebookById } from '@/core/diary/selectors';
import { collectNotebookMediaImages, groupNotebookMediaByMonth } from '@/core/state/mediaGallery';
import { DiaryMediaGrid } from '@/mobile/components/pages/diary-chat/media/DiaryMediaGrid';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { styles } from '@/mobile/styles/ui';
import { DiaryMedia } from '@/mobile/test.id';
import { localize } from '@/nls';
import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatMediaPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const groups = useMemo(
    () => (notebookId ? groupNotebookMediaByMonth(model, notebookId) : []),
    [model, notebookId],
  );
  const previewImages = useMemo(() => collectNotebookMediaImages(groups), [groups]);

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;

  return (
    <div className={styles.Page.Root} data-test-id={DiaryMedia.page}>
      <PageHeader title={localize('diary.media', 'Images and videos')} showBack />
      <main className={styles.DiaryMediaPage.Content} data-test-id={DiaryMedia.content}>
        {groups.length === 0 ? (
          <div className={styles.DiaryMediaPage.Empty} data-test-id={DiaryMedia.empty}>
            {localize('diary.media.empty', 'No images or videos yet')}
          </div>
        ) : (
          <DiaryMediaGrid groups={groups} previewImages={previewImages} />
        )}
      </main>
    </div>
  );
}
