import type { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import type { IHostService } from '@/services/native/common/hostService';
import { blobToDataUrl } from '@/base/just-vibes/binary-codec';
import { ensureBlobType } from '@/base/just-vibes/media-mime';
import { generateImageThumbnail } from './imageHandlers';
import type { AttachmentLocalCache } from './attachmentLocalCache';
import { requireMimeFromKey } from './attachmentLocalCache';
import type { FileAssetObjectStoreController } from './fileAssetObjectStoreController';
import {
  AttachmentUploadTaskRecord,
  BaseAttachmentUploadStore,
  LOCAL_FILE_MISSING_ERROR_CODE,
} from './uploadTaskStore';

interface VideoUploadPayload {
  task: AttachmentUploadTaskRecord;
  blob: Blob;
  thumbnail: Blob;
}

export class AttachmentUploadRunner {
  private running = false;

  constructor(
    private readonly uploadStore: BaseAttachmentUploadStore,
    private readonly localCache: AttachmentLocalCache,
    private readonly objectStoreController: FileAssetObjectStoreController,
    private readonly hostService: IHostService,
    private readonly testInjectionService: ITestInjectionService,
    private readonly getScope: () => string,
  ) {}

  async markMissingFiles(): Promise<void> {
    for (const task of await this.uploadStore.listTasks()) {
      // 视频源由原生侧 app 私有文件管理，缺失会在 prepareVideoUpload 阶段标记。
      if (task.type === 'video') continue;
      const missing = await this.findMissingLocalFile(task);
      if (missing) {
        await this.markTaskFailed(task, 'Local file is missing.', LOCAL_FILE_MISSING_ERROR_CODE);
      }
    }
  }

  async pump(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (true) {
        const task = await this.uploadStore.nextPendingTask();
        if (!task) return;
        await this.runTask(task);
      }
    } finally {
      this.running = false;
    }
  }

  private async runTask(task: AttachmentUploadTaskRecord): Promise<void> {
    let currentTask: AttachmentUploadTaskRecord = {
      ...task,
      status: 'uploading',
      errorCode: undefined,
      errorMessage: undefined,
    };
    await this.uploadStore.updateTask(currentTask);

    try {
      await this.testInjectionService.get('fileAsset.attachmentTask.beforeRun');
      if (currentTask.type === 'video') {
        const videoPayload = await this.prepareVideoUploadPayload(currentTask);
        currentTask = videoPayload.task;
        await this.putAttachmentObject(currentTask.thumbS3Key, videoPayload.thumbnail);
        await this.putAttachmentObject(currentTask.s3Key, videoPayload.blob);
        if (!this.hostService.caniuse('attachmentFileCache')) {
          await this.localCache.write(currentTask.s3Key, videoPayload.blob);
        }
        await this.localCache.write(currentTask.thumbS3Key, videoPayload.thumbnail);
        await this.uploadStore.updateTask({
          ...currentTask,
          status: 'done',
          errorCode: undefined,
          errorMessage: undefined,
        });
        await this.cleanupVideoTaskFiles(currentTask);
        return;
      }

      const originalBlob = await this.localCache.read(currentTask.s3Key);
      if (!originalBlob) throw new Error('Local file is missing.');
      if (currentTask.type === 'audio') {
        await this.putAttachmentObject(currentTask.s3Key, originalBlob);
        await this.uploadStore.updateTask({
          ...currentTask,
          status: 'done',
          errorCode: undefined,
          errorMessage: undefined,
        });
        return;
      }

      const thumbnailBlob = await generateImageThumbnail(originalBlob, this.hostService);
      await this.putAttachmentObject(currentTask.thumbS3Key, thumbnailBlob);
      await this.putAttachmentObject(currentTask.s3Key, originalBlob);
      await this.uploadLivePhotoOriginals(currentTask);
      await this.localCache.write(currentTask.thumbS3Key, thumbnailBlob);
      await this.uploadStore.updateTask({
        ...currentTask,
        status: 'done',
        errorCode: undefined,
        errorMessage: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markTaskFailed(
        currentTask,
        message,
        isMissingFileError(message) ? LOCAL_FILE_MISSING_ERROR_CODE : 'upload-failed',
      );
    }
  }

  private async prepareVideoUploadPayload(
    task: AttachmentUploadTaskRecord,
  ): Promise<VideoUploadPayload> {
    if (task.type !== 'video') {
      throw new Error('Video task is required.');
    }
    const prepared = await this.hostService.prepareVideoUpload({
      sourcePath: task.sourcePath,
      originalQuality: task.originalQuality,
      cacheKey: task.s3Key,
      cacheScope: this.getScope(),
    });
    const updatedPreviewThumbnail = await blobToDataUrl(prepared.thumbnail);
    const videoTask: AttachmentUploadTaskRecord = {
      ...task,
      width: prepared.width || task.width,
      height: prepared.height || task.height,
      duration: prepared.duration || task.duration,
      size: prepared.blob.size,
      previewThumbnail: updatedPreviewThumbnail || task.previewThumbnail,
      status: 'uploading',
    };
    await this.uploadStore.updateTask(videoTask);
    return {
      task: videoTask,
      blob: prepared.blob,
      thumbnail: prepared.thumbnail,
    };
  }

  private async cleanupVideoTaskFiles(task: AttachmentUploadTaskRecord): Promise<void> {
    if (task.type === 'video') {
      await this.hostService
        .cleanVideoRecord({ sourcePath: task.sourcePath, cacheScope: this.getScope() })
        .catch(() => undefined);
    }
  }

  private async markTaskFailed(
    task: AttachmentUploadTaskRecord,
    errorMessage: string,
    errorCode: AttachmentUploadTaskRecord['errorCode'],
  ): Promise<void> {
    await this.uploadStore.updateTask({
      ...task,
      status: 'failed',
      errorCode,
      errorMessage,
    });
  }

  private async putAttachmentObject(key: string, blob: Blob): Promise<void> {
    await this.testInjectionService.get('fileAsset.attachment.put');
    const mimeType = requireMimeFromKey(key);
    await this.objectStoreController
      .getObjectStore()
      .putAttachment(key, ensureBlobType(blob, mimeType));
  }

  private async findMissingLocalFile(
    task: AttachmentUploadTaskRecord,
  ): Promise<string | undefined> {
    for (const key of this.localFileKeys(task)) {
      const file = await this.localCache.read(key);
      if (!file) return key;
    }
    return undefined;
  }

  private async uploadLivePhotoOriginals(task: AttachmentUploadTaskRecord): Promise<void> {
    if (task.type !== 'image' || task.livePhoto?.kind !== 'ios-paired-files') return;
    for (const key of [task.livePhoto.stillS3Key, task.livePhoto.videoS3Key]) {
      if (!key || key === task.s3Key || key === task.thumbS3Key) continue;
      const blob = await this.localCache.read(key);
      if (!blob) throw new Error('Local file is missing.');
      await this.putAttachmentObject(key, blob);
    }
  }

  private localFileKeys(task: AttachmentUploadTaskRecord): string[] {
    const keys = [task.s3Key];
    if (task.type === 'image' && task.livePhoto?.kind === 'ios-paired-files') {
      keys.push(task.livePhoto.stillS3Key);
      if (task.livePhoto.videoS3Key) keys.push(task.livePhoto.videoS3Key);
    }
    return [...new Set(keys)];
  }
}

function isMissingFileError(message: string): boolean {
  return /local file is missing/i.test(message);
}
