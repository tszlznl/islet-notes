import { format, isSameDay } from 'date-fns';
import { getDateFnsLocale } from '@/locales/common/locale';
import {
  AttachmentRecord,
  DiaryEntryRecord,
  DiaryModelData,
  IdentityRecord,
  isKnownDiaryEntryType,
  NotebookRecord,
} from './type';

export function getNotebookById(
  model: DiaryModelData,
  notebookId: string,
): NotebookRecord | undefined {
  const notebook = model.notebookMap.get(notebookId);
  return notebook?.deletedAt ? undefined : notebook;
}

export function getAttachmentById(
  model: DiaryModelData,
  attachmentId: string,
): AttachmentRecord | undefined {
  const attachment = model.attachmentMap.get(attachmentId);
  return attachment?.deletedAt ? undefined : attachment;
}

export function getProfileAvatarAttachment(model: DiaryModelData): AttachmentRecord | undefined {
  const avatarAttachmentId = model.profile.avatarAttachmentId;
  return avatarAttachmentId ? getAttachmentById(model, avatarAttachmentId) : undefined;
}

/** 不过滤归档：历史消息、日历需要解析已归档身份。 */
export function getIdentityById(
  model: DiaryModelData,
  identityId: string,
): IdentityRecord | undefined {
  return model.identityMap.get(identityId);
}

export function getActiveIdentities(model: DiaryModelData): IdentityRecord[] {
  return model.identities.filter((identity) => !identity.archivedAt);
}

export function getArchivedIdentities(model: DiaryModelData): IdentityRecord[] {
  return model.identities.filter((identity) => !!identity.archivedAt);
}

export function getIdentityAvatarAttachment(
  model: DiaryModelData,
  identity: IdentityRecord | undefined,
): AttachmentRecord | undefined {
  if (!identity?.avatarAttachmentId) return undefined;
  return getAttachmentById(model, identity.avatarAttachmentId);
}

export function getEntriesByNotebook(
  model: DiaryModelData,
  notebookId: string,
): DiaryEntryRecord[] {
  return model.entries
    .filter((entry) => entry.notebookId === notebookId && !entry.deletedAt)
    .sort(compareEntries);
}

export function compareEntries(
  a: Pick<DiaryEntryRecord, 'createdAt' | 'displayAt' | 'id'>,
  b: Pick<DiaryEntryRecord, 'createdAt' | 'displayAt' | 'id'>,
) {
  const aTime = getEntryDisplayTime(a);
  const bTime = getEntryDisplayTime(b);
  if (aTime !== bTime) return aTime - bTime;
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.id.localeCompare(b.id);
}

export function getEntryDisplayTime(entry: Pick<DiaryEntryRecord, 'createdAt' | 'displayAt'>) {
  return typeof entry.displayAt === 'number' && Number.isFinite(entry.displayAt)
    ? entry.displayAt
    : entry.createdAt;
}

export function getLastEntry(
  model: DiaryModelData,
  notebookId: string,
): DiaryEntryRecord | undefined {
  const entries = getEntriesByNotebook(model, notebookId);
  return entries[entries.length - 1];
}

export function getNotebookListTime(model: DiaryModelData, notebook: NotebookRecord): number {
  const lastEntry = getLastEntry(model, notebook.id);
  return lastEntry ? getEntryDisplayTime(lastEntry) : notebook.createdAt;
}

export function getSortedNotebooks(model: DiaryModelData): NotebookRecord[] {
  const orderIndex = new Map(model.notebooks.map((notebook, index) => [notebook.id, index]));
  const lastEntryByNotebook = new Map<string, DiaryEntryRecord>();

  for (const entry of model.entries) {
    if (entry.deletedAt) continue;
    const current = lastEntryByNotebook.get(entry.notebookId);
    if (!current || compareEntries(current, entry) < 0) {
      lastEntryByNotebook.set(entry.notebookId, entry);
    }
  }

  return [...model.notebooks].sort((a, b) => {
    const aLastEntry = lastEntryByNotebook.get(a.id);
    const bLastEntry = lastEntryByNotebook.get(b.id);
    const aHasEntry = aLastEntry !== undefined;
    const bHasEntry = bLastEntry !== undefined;

    if (aLastEntry && bLastEntry) {
      const entryCompare = compareEntries(bLastEntry, aLastEntry);
      if (entryCompare !== 0) return entryCompare;
    }
    if (aHasEntry !== bHasEntry) return aHasEntry ? -1 : 1;
    if (!aHasEntry && !bHasEntry && a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;

    return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
  });
}

export function getEntrySummary(
  model: DiaryModelData,
  entry: DiaryEntryRecord | undefined,
): string {
  if (!entry) return '';
  if (entry.type === 'text') return entry.text ?? '';
  if (!isKnownDiaryEntryType(entry.type)) return '[Unsupported]';
  const attachment = entry.attachmentId ? getAttachmentById(model, entry.attachmentId) : undefined;
  if (attachment?.type === 'image') return '[Image]';
  if (attachment?.type === 'audio') return entry.text?.trim() || '[Voice]';
  if (attachment?.type === 'video') return '[Video]';
  return '[Attachment]';
}

export function shouldShowTimeDivider(
  previous: DiaryEntryRecord | undefined,
  current: DiaryEntryRecord,
): boolean {
  if (!previous) return true;
  return getEntryDisplayTime(current) - getEntryDisplayTime(previous) > 10 * 60 * 1000;
}

export function formatEntryTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const locale = getDateFnsLocale();
  if (isSameDay(date, now)) {
    return format(date, 'HH:mm', { locale });
  }
  return format(date, 'yyyy-MM-dd HH:mm', { locale });
}
