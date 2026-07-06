import { compareEntries, getAttachmentById, getNotebookById } from '@/core/diary/selectors';
import type {
  AudioAttachmentRecord,
  DiaryEntryRecord,
  DiaryModelData,
  ImageAttachmentRecord,
  VideoAttachmentRecord,
} from '@/core/diary/type';
import { isKnownDiaryEntryType } from '@/core/diary/type';
import { format } from 'date-fns';

export interface CalendarDayRecord {
  entry: DiaryEntryRecord;
  notebookName: string;
  /** 发送该记录时使用的身份昵称（含已归档身份），无身份为 undefined。 */
  identityName?: string;
  image?: ImageAttachmentRecord;
  audio?: AudioAttachmentRecord;
  video?: VideoAttachmentRecord;
}

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function groupEntriesByDate(
  model: DiaryModelData,
  notebookId?: string,
): Map<string, CalendarDayRecord[]> {
  const result = new Map<string, CalendarDayRecord[]>();

  for (const entry of model.entries) {
    if (entry.deletedAt) continue;
    if (notebookId && entry.notebookId !== notebookId) continue;
    if (!isKnownDiaryEntryType(entry.type)) continue;
    const notebook = getNotebookById(model, entry.notebookId);
    if (!notebook) continue;

    const attachment =
      entry.type === 'attachment' && entry.attachmentId
        ? getAttachmentById(model, entry.attachmentId)
        : undefined;
    const image = attachment?.type === 'image' ? attachment : undefined;
    const audio = attachment?.type === 'audio' ? attachment : undefined;
    const video = attachment?.type === 'video' ? attachment : undefined;
    if (entry.type === 'attachment' && !image && !audio && !video) continue;

    const identity = entry.identityId ? model.identityMap.get(entry.identityId) : undefined;
    const key = dateKey(new Date(entry.createdAt));
    const records = result.get(key) ?? [];
    records.push({
      entry,
      notebookName: notebook.name,
      identityName: identity?.name,
      image,
      audio,
      video,
    });
    result.set(key, records);
  }

  for (const records of result.values()) {
    records.sort((a, b) => compareEntries(a.entry, b.entry));
  }

  return result;
}
