import { getNotebookById } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { styles } from '@/mobile/styles/ui';
import { DiarySearch } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';
import { Navigate, useParams } from 'react-router';

export function DiaryChatSearchPage() {
  const { notebookId } = useParams();
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;

  return (
    <HeaderPage
      pageTestId={DiarySearch.page}
      contentTestId={DiarySearch.content}
      header={{ title: localize('diary.search', 'Find diary content'), showBack: true }}
    >
      <div className={styles.DiarySearchPage.Root}>
        <p className={styles.DiarySearchPage.Hint}>
          {localize('diary.search.hint', 'Quickly find diary content')}
        </p>
        <div className={styles.DiarySearchPage.Grid}>
          <button
            type='button'
            className={styles.DiarySearchPage.Option}
            data-test-id={DiarySearch.byDate}
            onClick={() =>
              navigationService.navigate({ path: `/calendar?notebookId=${notebookId}` })
            }
          >
            {localize('diary.search.byDate', 'Date')}
          </button>
          <span className={styles.DiarySearchPage.Divider} aria-hidden='true'>
            ｜
          </span>
          <button
            type='button'
            className={styles.DiarySearchPage.Option}
            data-test-id={DiarySearch.byMedia}
            onClick={() => navigationService.navigate({ path: `/diary/${notebookId}/media` })}
          >
            {localize('diary.media', 'Images and videos')}
          </button>
        </div>
      </div>
    </HeaderPage>
  );
}
