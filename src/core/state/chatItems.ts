import {
  getAttachmentById,
  getEntriesByNotebook,
  getEntryDisplayTime,
  getNotebookById,
} from '@/core/diary/selectors';
import {
  DiaryEntryRecord,
  DiaryModelData,
  ImageAttachmentRecord,
  NotebookRecord,
} from '@/core/diary/type';

export interface ChatUploadTaskLike {
  id: string;
  notebookId: string;
  createdAt: number;
}

export type ChatMessageSource<TUploadTask extends ChatUploadTaskLike = ChatUploadTaskLike> =
  | {
      kind: 'entry';
      id: string;
      createdAt: number;
      timestamp: number;
      entry: DiaryEntryRecord;
    }
  | {
      kind: 'upload';
      id: string;
      createdAt: number;
      timestamp: number;
      task: TUploadTask;
    };

export type ChatItem<TUploadTask extends ChatUploadTaskLike = ChatUploadTaskLike> =
  | {
      kind: 'divider';
      id: string;
      timestamp: number;
    }
  | ChatMessageSource<TUploadTask>;

export interface DiaryChatState<TUploadTask extends ChatUploadTaskLike = ChatUploadTaskLike> {
  notebook: NotebookRecord | undefined;
  entries: DiaryEntryRecord[];
  chatItems: ChatItem<TUploadTask>[];
  previewAttachments: ImageAttachmentRecord[];
}

export function getDiaryChatState<TUploadTask extends ChatUploadTaskLike>(
  model: DiaryModelData,
  notebookId: string | undefined,
  tasks: TUploadTask[],
): DiaryChatState<TUploadTask> {
  const notebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const entries = notebookId ? getEntriesByNotebook(model, notebookId) : [];
  const chatItems = buildChatItems(entries, tasks);
  return {
    notebook,
    entries,
    chatItems,
    previewAttachments: getChatPreviewAttachments(chatItems, model),
  };
}

export function getPendingChatUploadTasks<TUploadTask extends ChatUploadTaskLike>(
  entries: DiaryEntryRecord[],
  tasks: TUploadTask[],
): TUploadTask[] {
  const committedAttachmentIds = new Set(
    entries.map((entry) => entry.attachmentId).filter((id): id is string => !!id),
  );
  return tasks.filter((task) => !committedAttachmentIds.has(task.id));
}

export function buildChatItems<TUploadTask extends ChatUploadTaskLike>(
  entries: DiaryEntryRecord[],
  tasks: TUploadTask[],
): ChatItem<TUploadTask>[] {
  const pendingTasks = getPendingChatUploadTasks(entries, tasks);
  const messages: ChatMessageSource<TUploadTask>[] = [
    ...entries.map((entry) => ({
      kind: 'entry' as const,
      id: entry.id,
      createdAt: entry.createdAt,
      timestamp: getEntryDisplayTime(entry),
      entry,
    })),
    ...pendingTasks.map((task) => ({
      kind: 'upload' as const,
      id: task.id,
      createdAt: task.createdAt,
      timestamp: task.createdAt,
      task,
    })),
  ].sort(compareChatSources);

  const items: ChatItem<TUploadTask>[] = [];
  let previous: { timestamp: number } | undefined;
  for (const message of messages) {
    if (!previous || message.timestamp - previous.timestamp > 10 * 60 * 1000) {
      items.push({ kind: 'divider', id: `divider-${message.id}`, timestamp: message.timestamp });
    }
    items.push(message);
    previous = { timestamp: message.timestamp };
  }
  return items;
}

export function getChatPreviewAttachments<TUploadTask extends ChatUploadTaskLike>(
  items: ChatItem<TUploadTask>[],
  model: DiaryModelData,
): ImageAttachmentRecord[] {
  return items.flatMap((item) => {
    if (item.kind !== 'entry' || item.entry.type !== 'attachment' || !item.entry.attachmentId) {
      return [];
    }
    const attachment = getAttachmentById(model, item.entry.attachmentId);
    return attachment?.type === 'image' ? [attachment] : [];
  });
}

function compareChatSources(
  left: { timestamp: number; createdAt: number; id: string },
  right: { timestamp: number; createdAt: number; id: string },
) {
  if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
  if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt;
  return left.id.localeCompare(right.id);
}
