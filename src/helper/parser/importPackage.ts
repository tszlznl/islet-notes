import { bytesToArrayBuffer } from '@/base/just-vibes/binary-codec';
import { getNotebookById } from '@/core/diary/selectors';
import type { AttachmentRecord, CreateTextEntryOptions } from '@/core/diary/type';
import { localize } from '@/nls';
import type { IDiaryService } from '@/services/diary/common/diaryService';
import {
  imageUploadResultToAttachment,
  type IFileAssetService,
  videoUploadResultToAttachment,
} from '@/services/fileAsset/common/fileAssetService';
import type { ImportAssetContent, ImportAssetItem, ImportPackage, ImportProgress } from './type';

export interface ImportPackageOptions {
  notebookId: string;
  diaryService: IDiaryService;
  fileAssetService: IFileAssetService;
  onProgress?: (progress: ImportProgress) => void;
}

export async function importPackage(
  source: ImportPackage,
  options: ImportPackageOptions,
): Promise<ImportProgress> {
  assertNotebookExists(options);

  const progress: ImportProgress = {
    completed: 0,
    total: source.items.length,
    textImported: 0,
    textSkipped: 0,
    assetImported: 0,
    assetSkipped: 0,
  };
  const existingExternalEntries = collectExternalEntries(options.diaryService);

  const tick = () => {
    progress.completed += 1;
    options.onProgress?.({ ...progress });
  };

  const textEntries: CreateTextEntryOptions[] = [];
  for (const item of source.items) {
    if (item.type !== 'text') continue;
    if (existingExternalEntries.has(getExternalEntryKey(source.source.type, item.id))) {
      progress.textSkipped += 1;
    } else {
      textEntries.push({
        notebookId: options.notebookId,
        text: item.text,
        createdAt: item.createdAt,
        externalSource: source.source.type,
        externalId: item.id,
      });
      existingExternalEntries.add(getExternalEntryKey(source.source.type, item.id));
      progress.textImported += 1;
    }
    tick();
  }
  if (textEntries.length > 0) {
    options.diaryService.addTextEntriesWithOptions(textEntries);
  }

  // 同一个资源文件可能被多个 asset item 引用；源文件只读取一次，上传按 item 分别执行。
  const pendingByFilename = new Map<string, ImportAssetItem[]>();
  for (const item of source.items) {
    if (item.type !== 'asset') continue;
    if (existingExternalEntries.has(getExternalEntryKey(source.source.type, item.id))) {
      progress.assetSkipped += 1;
      tick();
      continue;
    }
    const pending = pendingByFilename.get(item.filename);
    if (pending) {
      pending.push(item);
    } else {
      pendingByFilename.set(item.filename, [item]);
    }
  }

  for await (const asset of source.streamAssets()) {
    const pending = pendingByFilename.get(asset.filename);
    if (!pending) continue;

    for (const item of pending) {
      const attachment = await uploadAsset(item, asset, options);
      addAssetEntry(
        item,
        { ...attachment, createdAt: item.createdAt },
        source.source.type,
        options,
      );
      existingExternalEntries.add(getExternalEntryKey(source.source.type, item.id));
      progress.assetImported += 1;
      tick();
    }
    pendingByFilename.delete(asset.filename);
  }

  for (const pending of pendingByFilename.values()) {
    progress.assetSkipped += pending.length;
    for (const _item of pending) tick();
  }

  options.onProgress?.({ ...progress });
  return progress;
}

async function uploadAsset(
  item: ImportAssetItem,
  asset: ImportAssetContent,
  options: ImportPackageOptions,
): Promise<AttachmentRecord> {
  const blob = new Blob([bytesToArrayBuffer(asset.content)], { type: asset.mimeType ?? '' });
  if (item.mediaType === 'video') {
    const uploaded = await options.fileAssetService.uploadVideo(blob, {
      mimeType: asset.mimeType,
    });
    return videoUploadResultToAttachment(uploaded, options.notebookId);
  }

  const uploaded = await options.fileAssetService.uploadImage(blob, {
    thumbnail: true,
  });
  return imageUploadResultToAttachment(uploaded, options.notebookId);
}

function assertNotebookExists(options: ImportPackageOptions): void {
  if (getNotebookById(options.diaryService.modelState, options.notebookId)) return;
  throw new Error(
    localize(
      'settings.import.targetNotebookUnavailable',
      'Target notebook is unavailable. Choose another notebook.',
    ),
  );
}

function addAssetEntry(
  item: ImportAssetItem,
  attachment: AttachmentRecord,
  sourceType: string,
  options: ImportPackageOptions,
): void {
  options.diaryService.addAttachmentEntry({
    attachment: {
      ...attachment,
      notebookId: options.notebookId,
    },
    createdAt: item.createdAt,
    externalSource: sourceType,
    externalId: item.id,
  });
}

function collectExternalEntries(diaryService: IDiaryService): Set<string> {
  const entries = new Set<string>();
  for (const entry of diaryService.modelState.entries) {
    if (!entry.externalSource || !entry.externalId) continue;
    entries.add(getExternalEntryKey(entry.externalSource, entry.externalId));
  }
  return entries;
}

function getExternalEntryKey(source: string, id: string): string {
  return `${source}\n${id}`;
}
