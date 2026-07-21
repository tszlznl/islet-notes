import { format, isSameDay } from 'date-fns';
import { getDateFnsLocale } from '@/locales/common/locale';
import { localize } from '@/nls';
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

export function isNotebookNameTaken(
  model: DiaryModelData,
  name: string,
  excludeNotebookId?: string,
): boolean {
  const normalized = normalizeNotebookName(name);
  if (!normalized) return false;
  return model.notebooks.some(
    (notebook) =>
      notebook.id !== excludeNotebookId &&
      !notebook.deletedAt &&
      normalizeNotebookName(notebook.name) === normalized,
  );
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

/** 展示时间晚于 now 的消息（时光机写给未来的），常规视图不展示。 */
export function isFutureEntry(
  entry: Pick<DiaryEntryRecord, 'createdAt' | 'displayAt'>,
  now: number,
): boolean {
  return getEntryDisplayTime(entry) > now;
}

export function getEntriesByNotebook(
  model: DiaryModelData,
  notebookId: string,
  now = Date.now(),
): DiaryEntryRecord[] {
  return model.entries
    .filter(
      (entry) => entry.notebookId === notebookId && !entry.deletedAt && !isFutureEntry(entry, now),
    )
    .sort(compareEntries);
}

/** 全部未来消息（跨日记本），按展示时间升序，供会员“未来消息”页查看。 */
export function getFutureEntries(model: DiaryModelData, now = Date.now()): DiaryEntryRecord[] {
  return model.entries
    .filter(
      (entry) =>
        !entry.deletedAt && !!getNotebookById(model, entry.notebookId) && isFutureEntry(entry, now),
    )
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

export function getSortedNotebooks(model: DiaryModelData, now = Date.now()): NotebookRecord[] {
  const orderIndex = new Map(model.notebooks.map((notebook, index) => [notebook.id, index]));
  const lastEntryByNotebook = new Map<string, DiaryEntryRecord>();

  for (const entry of model.entries) {
    if (entry.deletedAt || isFutureEntry(entry, now)) continue;
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

export interface EntryQuote {
  senderName: string;
  summary: string;
}

/** 解析被引用消息的展示信息；被引用消息不存在或已删除时返回 undefined（渲染占位文案）。 */
export function getEntryQuote(
  model: DiaryModelData,
  replyToEntryId: string | undefined,
): EntryQuote | undefined {
  if (!replyToEntryId) return undefined;
  const entry = model.entryMap.get(replyToEntryId);
  if (!entry || entry.deletedAt) return undefined;
  const identity = entry.identityId ? getIdentityById(model, entry.identityId) : undefined;
  const senderName =
    identity?.name ?? (model.profile.name?.trim() || localize('identity.switchToSelf', 'Me'));
  return { senderName, summary: getEntrySummary(model, entry) };
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

function normalizeNotebookName(name: string): string {
  return name.trim();
}
