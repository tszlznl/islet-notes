import { compareEntries, getAttachmentById, getNotebookById } from '@/core/diary/selectors';
import type {
  DiaryEntryRecord,
  DiaryModelData,
  ImageAttachmentRecord,
  VideoAttachmentRecord,
} from '@/core/diary/type';
import { format } from 'date-fns';

export interface NotebookMediaItem {
  entry: DiaryEntryRecord;
  image?: ImageAttachmentRecord;
  video?: VideoAttachmentRecord;
}

export interface NotebookMediaMonthGroup {
  /** 'yyyy-MM',用于分组与排序 */
  monthKey: string;
  /** 当月第一天的时间戳,供页面按语言格式化标题 */
  monthStart: number;
  items: NotebookMediaItem[];
}

/**
 * 按月归集某个日记本内的图片与视频附件,月份与月内条目均按时间倒序(最新在前),
 * 供“图片与视频”瀑布式相册使用。
 */
export function groupNotebookMediaByMonth(
  model: DiaryModelData,
  notebookId: string,
): NotebookMediaMonthGroup[] {
  if (!getNotebookById(model, notebookId)) return [];

  const buckets = new Map<string, NotebookMediaItem[]>();
  for (const entry of model.entries) {
    if (entry.deletedAt) continue;
    if (entry.notebookId !== notebookId) continue;
    if (entry.type !== 'attachment' || !entry.attachmentId) continue;

    const attachment = getAttachmentById(model, entry.attachmentId);
    const image = attachment?.type === 'image' ? attachment : undefined;
    const video = attachment?.type === 'video' ? attachment : undefined;
    if (!image && !video) continue;

    const monthKey = format(new Date(entry.createdAt), 'yyyy-MM');
    const items = buckets.get(monthKey) ?? [];
    items.push({ entry, image, video });
    buckets.set(monthKey, items);
  }

  const groups: NotebookMediaMonthGroup[] = [];
  for (const [monthKey, items] of buckets) {
    items.sort((a, b) => compareEntries(b.entry, a.entry));
    groups.push({
      monthKey,
      monthStart: new Date(`${monthKey}-01T00:00:00`).getTime(),
      items,
    });
  }
  groups.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  return groups;
}

/** 相册内全部图片附件,用于图片预览滑动列表(按展示顺序)。 */
export function collectNotebookMediaImages(
  groups: NotebookMediaMonthGroup[],
): ImageAttachmentRecord[] {
  return groups.flatMap((group) => group.items.flatMap((item) => (item.image ? [item.image] : [])));
}
