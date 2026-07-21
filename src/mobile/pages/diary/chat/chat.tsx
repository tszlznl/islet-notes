import { useEntryHighlight } from '@/base/just-vibes/entry-highlight';
import { getAttachmentById } from '@/core/diary/selectors';
import { getDiaryChatState } from '@/core/state/chatItems';
import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { PageHeader, PageHeaderRight } from '@/mobile/components/PageHeader';
import { DiaryChatFooter } from '@/mobile/components/pages/diary-chat/chat/DiaryChatFooter';
import {
  ChatMessage,
  EntryHighlightProvider,
} from '@/mobile/components/pages/diary-chat/chat/main';
import {
  ReplyDraftContext,
  type ReplyDraftContextValue,
} from '@/mobile/components/pages/diary-chat/chat/replyDraftContext';
import { useAttachmentFileUrl } from '@/mobile/hooks/useAttachmentFileUrl';
import { useDiaryChatChromeHeight } from '@/mobile/hooks/pages/diary-chat/useDiaryChatChromeHeight';
import { useDiaryChatVirtualList } from '@/mobile/hooks/pages/diary-chat/useDiaryChatVirtualList';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useUploadTasks } from '@/mobile/hooks/useUploadTasks';
import { useWindowSize } from '@/mobile/hooks/useWindowSize';
import { cx, styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { ISpeechRecognitionService } from '@/services/speechRecognition/common/speechRecognitionService';
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { VariableSizeList } from 'react-window';

export function DiaryChatPage() {
  const { notebookId } = useParams();
  const [searchParams] = useSearchParams();
  const targetEntryId = searchParams.get('targetEntryId') ?? undefined;
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const speechRecognitionService = useService(ISpeechRecognitionService);
  useWatchEvent(speechRecognitionService.onDidChangeTranscribing);
  const transcribingVersion = speechRecognitionService.getTranscribingVersion();
  const isTranscribing = useCallback(
    (entryId: string) => speechRecognitionService.isTranscribing(entryId),
    [speechRecognitionService],
  );
  const size = useWindowSize();
  const tasks = useUploadTasks(notebookId);
  // 引用草稿:长按菜单选"引用"后写入,发送或手动清除后复位;切换日记本时不保留。
  const [replyToEntryId, setReplyToEntryId] = useState<string>();
  useEffect(() => {
    setReplyToEntryId(undefined);
  }, [notebookId]);
  const replyDraft = useMemo<ReplyDraftContextValue>(
    () => ({ replyToEntryId, setReplyToEntryId }),
    [replyToEntryId],
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const chromeHeight = useDiaryChatChromeHeight({
    headerRef,
    footerRef,
  });

  const headerProps: PageHeaderRight = {
    type: 'icon',
    icon: 'ellipsis',
    label: localize('diary.settings', 'Notebook settings'),
    testId: DiaryChat.settings,
    onClick: () => navigationService.navigate({ path: `/diary/${notebookId}/settings` }),
  };

  const { notebook, chatItems, previewAttachments } = useMemo(
    () => getDiaryChatState(model, notebookId, tasks),
    [model, notebookId, tasks],
  );
  const backgroundCandidate = notebook?.chatBackgroundAttachmentId
    ? getAttachmentById(model, notebook.chatBackgroundAttachmentId)
    : undefined;
  const backgroundAttachment =
    backgroundCandidate?.type === 'image' ? backgroundCandidate : undefined;
  const backgroundUrl = useAttachmentFileUrl(backgroundAttachment?.s3Key, { role: 'large' });
  const backgroundFrameStyle = useMemo<CSSProperties>(
    () =>
      backgroundUrl
        ? { ...getStableBackgroundFrameStyle(), backgroundImage: `url(${backgroundUrl})` }
        : {},
    [backgroundUrl],
  );

  // 定位到目标消息后将其点亮一次;状态会在动画结束后自动清除,可重复触发。
  const { highlightedEntryId, triggerHighlight } = useEntryHighlight();
  const [entryFocusRequest, setEntryFocusRequest] = useState<{
    entryId: string;
    serial: number;
  }>();
  const focusEntry = useCallback(
    (entryId: string) => {
      triggerHighlight(entryId);
      setEntryFocusRequest((current) => ({
        entryId,
        serial: (current?.serial ?? 0) + 1,
      }));
    },
    [triggerHighlight],
  );
  useEffect(() => {
    if (targetEntryId) focusEntry(targetEntryId);
  }, [targetEntryId, focusEntry]);
  const scrollTargetEntryId = entryFocusRequest?.entryId ?? targetEntryId;
  const targetScrollKey = entryFocusRequest
    ? `entry:${entryFocusRequest.entryId}:${entryFocusRequest.serial}`
    : undefined;
  const listHeight = Math.max(1, Math.floor(size.height - chromeHeight));
  const { itemKey, itemSize, listRef } = useDiaryChatVirtualList({
    chatItems,
    model,
    notebookId,
    targetEntryId: scrollTargetEntryId,
    targetScrollKey,
    viewportWidth: size.width,
    isTranscribing,
    transcribingVersion,
  });

  if (!notebook || !notebookId) return <Navigate to='/diaries' replace />;

  return (
    <ReplyDraftContext.Provider value={replyDraft}>
      <div
        className={cx(styles.Page.Root, styles.DiaryChatPage.RootChat)}
        data-test-id={DiaryChat.page}
      >
        {backgroundUrl && (
          <div
            className={styles.DiaryChatPage.Background}
            data-test-id={DiaryChat.background}
            style={backgroundFrameStyle}
            aria-hidden='true'
          />
        )}
        <div className={styles.DiaryChatPage.Content}>
          <div ref={headerRef}>
            <PageHeader title={notebook.name} showBack right={headerProps} />
          </div>
          <main
            className={styles.DiaryChatPage.Main}
            data-test-id={DiaryChat.list}
            style={{ height: listHeight }}
          >
            {chatItems.length === 0 ? (
              <div className={styles.DiaryChatPage.Empty} data-test-id={DiaryChat.empty}>
                {localize('diary.chat.empty', 'No entries yet')}
              </div>
            ) : (
              <EntryHighlightProvider
                highlightedEntryId={highlightedEntryId}
                triggerHighlight={focusEntry}
              >
                <VariableSizeList
                  ref={listRef}
                  height={listHeight}
                  width='100%'
                  itemCount={chatItems.length}
                  itemSize={itemSize}
                  itemKey={itemKey}
                  itemData={{ items: chatItems, model, previewAttachments }}
                >
                  {ChatMessage}
                </VariableSizeList>
              </EntryHighlightProvider>
            )}
          </main>
          <DiaryChatFooter ref={footerRef} notebookId={notebookId} />
        </div>
      </div>
    </ReplyDraftContext.Provider>
  );
}

function getStableBackgroundFrameStyle(): CSSProperties {
  const width = Math.max(window.innerWidth, window.screen?.width ?? 0);
  const height = Math.max(window.innerHeight, window.screen?.height ?? 0);
  return { width, height };
}
