import type { DiaryModelData } from '@/core/diary/type';
import {
  estimateDiaryChatItemHeight,
  type DiaryChatItem,
} from '@/mobile/components/pages/diary-chat/chat/main';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { VariableSizeList } from 'react-window';

interface UseDiaryChatVirtualListParams {
  chatItems: DiaryChatItem[];
  model: DiaryModelData;
  notebookId: string | undefined;
  targetEntryId: string | undefined;
  targetScrollKey?: string;
  viewportWidth: number;
  isTranscribing?: (entryId: string) => boolean;
  transcribingVersion?: number;
}

export function useDiaryChatVirtualList({
  chatItems,
  model,
  notebookId,
  targetEntryId,
  targetScrollKey,
  viewportWidth,
  isTranscribing,
  transcribingVersion = 0,
}: UseDiaryChatVirtualListParams) {
  const listRef = useRef<VariableSizeList>(null);
  const previousListStateRef = useRef({
    itemCount: 0,
    latestRenderKey: null as string | null,
    scrollKey: null as string | null,
    targetIndex: -1,
    width: 0,
    version: null as DiaryModelData['version'] | null,
    transcribingVersion: 0,
  });

  const targetIndex = useMemo(() => {
    return findDiaryChatTargetIndex(chatItems, targetEntryId);
  }, [chatItems, targetEntryId]);
  const latestRenderKey = useMemo(
    () => getDiaryChatLatestRenderKey(chatItems, isTranscribing, transcribingVersion),
    [chatItems, isTranscribing, transcribingVersion],
  );
  const scrollKey = `${notebookId ?? ''}:${targetScrollKey ?? targetEntryId ?? 'latest'}`;

  const itemSize = useCallback(
    (index: number) => {
      const item = chatItems[index];
      if (!item) return 64;
      return estimateDiaryChatItemHeight(
        item,
        viewportWidth,
        Math.min(viewportWidth - 32, 520),
        model,
        isTranscribing,
      );
    },
    [chatItems, model, viewportWidth, isTranscribing],
  );
  const itemKey = useCallback((index: number) => chatItems[index]?.id ?? index, [chatItems]);

  useLayoutEffect(() => {
    const previous = previousListStateRef.current;
    const contextChanged = previous.scrollKey !== scrollKey;
    const itemSizeContextChanged =
      previous.width !== viewportWidth ||
      previous.version !== model.version ||
      previous.transcribingVersion !== transcribingVersion;
    const hasNewItems = chatItems.length > previous.itemCount;
    const latestItemChanged =
      previous.latestRenderKey !== null && previous.latestRenderKey !== latestRenderKey;
    const targetIndexChanged =
      !!targetEntryId && targetIndex >= 0 && previous.targetIndex !== targetIndex;

    if (contextChanged || itemSizeContextChanged || targetIndexChanged) {
      listRef.current?.resetAfterIndex(0, itemSizeContextChanged);
    } else if (hasNewItems) {
      listRef.current?.resetAfterIndex(previous.itemCount, false);
    } else if (latestItemChanged) {
      listRef.current?.resetAfterIndex(Math.max(0, chatItems.length - 1), false);
    }

    if ((contextChanged || targetIndexChanged) && targetIndex >= 0) {
      listRef.current?.scrollToItem(targetIndex, 'center');
    } else if ((contextChanged || hasNewItems || latestItemChanged) && chatItems.length > 0) {
      listRef.current?.scrollToItem(chatItems.length - 1, 'end');
    }

    previousListStateRef.current = {
      itemCount: chatItems.length,
      latestRenderKey,
      scrollKey,
      targetIndex,
      width: viewportWidth,
      version: model.version,
      transcribingVersion,
    };
  }, [
    chatItems.length,
    latestRenderKey,
    model.version,
    scrollKey,
    targetIndex,
    targetEntryId,
    viewportWidth,
    transcribingVersion,
  ]);

  return { itemKey, itemSize, listRef };
}

export function findDiaryChatTargetIndex(
  chatItems: DiaryChatItem[],
  targetEntryId?: string,
): number {
  if (!targetEntryId) return -1;
  return chatItems.findIndex((item) => item.kind === 'entry' && item.entry.id === targetEntryId);
}

function getDiaryChatLatestRenderKey(
  chatItems: DiaryChatItem[],
  isTranscribing?: (entryId: string) => boolean,
  transcribingVersion = 0,
): string {
  // 最新消息的渲染状态变化会影响列表底部位置;例如语音识别写回文本后,
  // 同一条音频消息会变高,需要重算最后一项并把它完整滚进页面里。
  const latest = chatItems[chatItems.length - 1];
  if (!latest) return 'empty';
  if (latest.kind === 'divider') return `divider:${latest.id}:${latest.timestamp}`;
  if (latest.kind === 'upload') {
    return `upload:${latest.id}:${latest.task.updatedAt}`;
  }
  const { entry } = latest;
  const transcribingKey = isTranscribing?.(entry.id) ? transcribingVersion : 'idle';
  return `entry:${entry.id}:${entry.type}:${entry.updatedAt}:${transcribingKey}`;
}
