import type { SyncConfigRecord } from '@/core/diary/type';
import { syncStoragePath } from '@/core/spec/syncStoragePath';
import { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import { IHostService } from '@/services/native/common/hostService';
import { readImageDimensions } from '@/base/just-vibes/browser-image-processing';
import { ensureBlobType } from '@/base/just-vibes/media-mime';
import { generateImageThumbnail } from './imageHandlers';
import {
  AttachmentUploadTaskRecord,
  BaseAttachmentUploadStore,
  HostAttachmentUploadStore,
  LOCAL_FILE_MISSING_ERROR_CODE,
} from './uploadTaskStore';
import type {
  SyncDatabaseSnapshotMergeReturn,
  SyncDatabaseSnapshotOptions,
} from '@/base/just-vibes/file-asset-object-store';
import {
  type CreateAudioAttachmentUploadTaskOptions,
  type CreateImageAttachmentUploadTaskOptions,
  type CreateVideoAttachmentUploadTaskOptions,
  type FileUrlOptions,
  type ImageUploadResult,
  type UploadImageOptions,
  type UploadVideoOptions,
  type VideoUploadResult,
} from './fileAssetTypes';
import { AttachmentLocalCache, requireMimeFromKey } from './attachmentLocalCache';
import { AttachmentUploadRunner } from './attachmentUploadRunner';
import { AttachmentUrlResolver } from './attachmentUrlResolver';
import { DatabaseSnapshotSync } from './databaseSnapshotSync';
import { FileAssetObjectStoreController } from './fileAssetObjectStoreController';
import { nanoid } from 'nanoid';
import { Emitter, Event } from 'vscf/base/common/event';
import { createDecorator } from 'vscf/platform/instantiation/common';

export type {
  SyncDatabaseSnapshotMergeResult,
  SyncDatabaseSnapshotOptions,
} from '@/base/just-vibes/file-asset-object-store';
export type {
  CreateAudioAttachmentUploadTaskOptions,
  CreateImageAttachmentUploadTaskOptions,
  CreateVideoAttachmentUploadTaskOptions,
  FileUrlOptions,
  ImageUploadResult,
  UploadImageOptions,
  UploadVideoOptions,
  VideoUploadResult,
} from './fileAssetTypes';
export {
  audioAttachmentTaskToAttachment,
  imageAttachmentTaskToAttachment,
  imageUploadResultToAttachment,
  videoAttachmentTaskToAttachment,
  videoUploadResultToAttachment,
} from './attachmentRecordMappers';

export interface IFileAssetService {
  readonly _serviceBrand: undefined;
  readonly onDidChangeTasks: Event<void>;
  readonly onDidChangeConfig: Event<void>;
  readonly uploadingTasks: readonly AttachmentUploadTaskRecord[];
  getSyncConfig(): SyncConfigRecord | undefined;
  saveSyncConfig(
    config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
  ): Promise<SyncConfigRecord | undefined>;
  clearSyncConfig(): Promise<void>;
  getStorageScope(): string;
  start(scope?: string): Promise<void>;
  listAttachmentTasks(notebookId?: string): Promise<AttachmentUploadTaskRecord[]>;
  uploadImageAttachment(
    options: CreateImageAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord>;
  uploadAudioAttachment(
    options: CreateAudioAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord>;
  uploadVideoAttachment(
    options: CreateVideoAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord>;
  updateAudioAttachmentTaskTranscript(taskId: string, transcript: string): Promise<void>;
  retryAttachmentTask(taskId: string): Promise<void>;
  deleteAttachmentTask(taskId: string): Promise<void>;
  uploadImage(file: Blob, options?: UploadImageOptions): Promise<ImageUploadResult>;
  uploadVideo(file: Blob, options?: UploadVideoOptions): Promise<VideoUploadResult>;
  syncDatabaseSnapshot(
    localSnapshot: Uint8Array,
    mergeRemoteSnapshot: (remoteSnapshot: Uint8Array) => SyncDatabaseSnapshotMergeReturn,
    options?: SyncDatabaseSnapshotOptions,
  ): Promise<Uint8Array | undefined>;
  putDatabaseSnapshot(key: string, snapshot: Uint8Array): Promise<void>;
  getDatabaseSnapshot(key: string): Promise<Uint8Array | undefined>;
  getFileUrl(key: string, options: FileUrlOptions): Promise<string | undefined>;
}

export const IFileAssetService = createDecorator<IFileAssetService>('IFileAssetService');

export class FileAssetService implements IFileAssetService {
  readonly _serviceBrand: undefined;
  private readonly _onDidChangeTasks = new Emitter<void>();
  private readonly _onDidChangeConfig = new Emitter<void>();
  readonly onDidChangeTasks = this._onDidChangeTasks.event;
  readonly onDidChangeConfig = this._onDidChangeConfig.event;
  private started = false;
  private tasks: AttachmentUploadTaskRecord[] = [];
  private readonly uploadStore: BaseAttachmentUploadStore;
  private readonly localCache: AttachmentLocalCache;
  private readonly objectStoreController: FileAssetObjectStoreController;
  private readonly databaseSync: DatabaseSnapshotSync;
  private readonly urlResolver: AttachmentUrlResolver;
  private readonly uploadRunner: AttachmentUploadRunner;
  private storageScope = 'local';

  constructor(
    initialSyncConfig: SyncConfigRecord | null | undefined = undefined,
    @IHostService private readonly hostService: IHostService,
    @ITestInjectionService private readonly testInjectionService: ITestInjectionService,
  ) {
    this.uploadStore = new HostAttachmentUploadStore(hostService);
    this.localCache = new AttachmentLocalCache(hostService, () => this.storageScope);
    this.objectStoreController = new FileAssetObjectStoreController(
      initialSyncConfig,
      hostService,
      () => this._onDidChangeConfig.fire(),
    );
    this.databaseSync = new DatabaseSnapshotSync(
      this.objectStoreController,
      this.testInjectionService,
    );
    this.urlResolver = new AttachmentUrlResolver(
      this.localCache,
      this.objectStoreController,
      () => this.storageScope,
    );
    this.uploadRunner = new AttachmentUploadRunner(
      this.uploadStore,
      this.localCache,
      this.objectStoreController,
      hostService,
      testInjectionService,
      () => this.storageScope,
    );
    this.uploadStore.onDidChange(() => {
      void this.refreshTasks();
    });
  }

  get uploadingTasks(): readonly AttachmentUploadTaskRecord[] {
    return this.tasks;
  }

  getSyncConfig(): SyncConfigRecord | undefined {
    return this.objectStoreController.getSyncConfig();
  }

  async saveSyncConfig(
    config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
  ): Promise<SyncConfigRecord | undefined> {
    const saved = await this.objectStoreController.saveSyncConfig(config);
    if (saved) void this.uploadRunner.pump();
    return saved;
  }

  async clearSyncConfig(): Promise<void> {
    await this.objectStoreController.clearSyncConfig();
  }

  async start(scope?: string): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.storageScope = scope ?? 'local';
    await this.uploadStore.init(this.storageScope);
    await this.uploadStore.resetActiveTasks();
    await this.uploadRunner.markMissingFiles();
    await this.refreshTasks();
  }

  getStorageScope(): string {
    return this.storageScope;
  }

  async listAttachmentTasks(notebookId?: string): Promise<AttachmentUploadTaskRecord[]> {
    const tasks = notebookId
      ? await this.uploadStore.listTasksByNotebook(notebookId)
      : await this.uploadStore.listTasks();
    return tasks.filter((task) => (task.purpose ?? 'entry') === 'entry');
  }

  async uploadImageAttachment(
    options: CreateImageAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord> {
    const { file, notebookId } = options;
    const dimensions = await readImageDimensions(file);
    const createdAt = Date.now();
    const id = nanoid();
    const { s3Key, thumbS3Key } = await this.buildImageUploadKeys(id, file.type, true);
    await this.localCache.write(s3Key, file);
    const task: AttachmentUploadTaskRecord = {
      id,
      notebookId,
      purpose: 'entry',
      type: 'image',
      s3Key,
      thumbS3Key,
      mimeType: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      identityId: options.identityId,
      status: 'pending',
      queueSeq: await this.uploadStore.getNextQueueSeq(),
      createdAt,
      updatedAt: createdAt,
    };
    await this.uploadStore.addTask(task);
    void this.uploadRunner.pump();
    return task;
  }

  async uploadAudioAttachment(
    options: CreateAudioAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord> {
    const { file, notebookId, duration, transcript } = options;
    const mimeType = file.type;
    const createdAt = Date.now();
    const id = nanoid();
    const s3Key = syncStoragePath.audio(id, mimeType);
    await this.localCache.write(s3Key, file);
    const task: AttachmentUploadTaskRecord = {
      id,
      notebookId,
      purpose: 'entry',
      type: 'audio',
      s3Key,
      thumbS3Key: s3Key,
      mimeType,
      size: file.size,
      width: 0,
      height: 0,
      duration,
      transcript,
      identityId: options.identityId,
      status: 'pending',
      queueSeq: await this.uploadStore.getNextQueueSeq(),
      createdAt,
      updatedAt: createdAt,
    };
    await this.uploadStore.addTask(task);
    void this.uploadRunner.pump();
    return task;
  }

  async uploadVideoAttachment(
    options: CreateVideoAttachmentUploadTaskOptions,
  ): Promise<AttachmentUploadTaskRecord> {
    const createdAt = Date.now();
    const id = nanoid();
    const { s3Key, thumbS3Key } = syncStoragePath.video(id);
    const task: AttachmentUploadTaskRecord = {
      id,
      notebookId: options.notebookId,
      purpose: 'entry',
      type: 'video',
      sourcePath: options.sourcePath,
      originalQuality: options.originalQuality,
      s3Key,
      thumbS3Key,
      mimeType: options.mimeType || 'video/mp4',
      size: options.size,
      width: options.width ?? 0,
      height: options.height ?? 0,
      duration: options.durationMs ? Math.round(options.durationMs / 1000) : 0,
      previewThumbnail: options.previewThumbnail,
      identityId: options.identityId,
      status: 'pending',
      queueSeq: await this.uploadStore.getNextQueueSeq(),
      createdAt,
      updatedAt: createdAt,
    };
    await this.uploadStore.addTask(task);
    void this.uploadRunner.pump();
    return task;
  }

  async uploadVideo(file: Blob, options: UploadVideoOptions = {}): Promise<VideoUploadResult> {
    const mimeType = options.mimeType || file.type || 'video/mp4';
    const sourcePath = `memory/video-sources/${nanoid()}.mp4`;
    await this.localCache.write(sourcePath, ensureBlobType(file, mimeType));

    const createdAt = Date.now();
    const id = nanoid();
    const { s3Key, thumbS3Key } = syncStoragePath.video(id);

    try {
      const prepared = await this.hostService.prepareVideoUpload({
        sourcePath,
        originalQuality: true,
        cacheKey: s3Key,
        cacheScope: this.storageScope,
      });
      await this.putAttachmentObject(thumbS3Key, prepared.thumbnail);
      await this.putAttachmentObject(s3Key, prepared.blob);
      if (!this.hostService.caniuse('attachmentFileCache')) {
        await this.localCache.write(s3Key, prepared.blob);
      }
      await this.localCache.write(thumbS3Key, prepared.thumbnail);

      return {
        id,
        key: s3Key,
        thumbKey: thumbS3Key,
        mimeType,
        size: prepared.blob.size,
        width: prepared.width,
        height: prepared.height,
        duration: prepared.duration,
        createdAt,
      };
    } finally {
      await this.hostService
        .cleanVideoRecord({ sourcePath, cacheScope: this.storageScope })
        .catch(() => undefined);
    }
  }

  async updateAudioAttachmentTaskTranscript(taskId: string, transcript: string): Promise<void> {
    const task = await this.uploadStore.getTask(taskId);
    if (!task || task.type !== 'audio') return;
    await this.uploadStore.updateTask({
      ...task,
      transcript,
    });
  }

  async retryAttachmentTask(taskId: string): Promise<void> {
    const task = await this.uploadStore.getTask(taskId);
    if (!task || task.status !== 'failed' || task.errorCode === LOCAL_FILE_MISSING_ERROR_CODE)
      return;
    await this.uploadStore.updateTask({
      ...task,
      status: 'pending',
      errorCode: undefined,
      errorMessage: undefined,
    });
    void this.uploadRunner.pump();
  }

  async deleteAttachmentTask(taskId: string): Promise<void> {
    const task = await this.uploadStore.getTask(taskId);
    if (!task) return;
    await this.uploadStore.deleteTask(taskId);
    if (task.type === 'video') {
      await this.hostService
        .cleanVideoRecord({ sourcePath: task.sourcePath, cacheScope: this.storageScope })
        .catch(() => undefined);
    }
  }

  async uploadImage(file: Blob, options: UploadImageOptions = {}): Promise<ImageUploadResult> {
    const dimensions = await readImageDimensions(file);
    const id = nanoid();
    const createdAt = Date.now();
    const { s3Key, thumbS3Key } = await this.buildImageUploadKeys(
      id,
      file.type,
      !!options.thumbnail,
    );
    const thumbnailBlob = options.thumbnail
      ? await generateImageThumbnail(file, this.hostService)
      : undefined;

    await this.localCache.write(s3Key, file);
    if (thumbnailBlob) {
      await this.localCache.write(thumbS3Key, thumbnailBlob);
    }

    await this.putAttachmentObject(s3Key, file);
    if (thumbnailBlob) {
      await this.putAttachmentObject(thumbS3Key, thumbnailBlob);
    }

    return {
      id,
      key: s3Key,
      thumbKey: thumbnailBlob ? thumbS3Key : undefined,
      mimeType: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      createdAt,
    };
  }

  async syncDatabaseSnapshot(
    localSnapshot: Uint8Array,
    mergeRemoteSnapshot: (remoteSnapshot: Uint8Array) => SyncDatabaseSnapshotMergeReturn,
    options: SyncDatabaseSnapshotOptions = {},
  ): Promise<Uint8Array | undefined> {
    return this.databaseSync.syncDatabaseSnapshot(localSnapshot, mergeRemoteSnapshot, options);
  }

  async putDatabaseSnapshot(key: string, snapshot: Uint8Array): Promise<void> {
    await this.databaseSync.putDatabaseSnapshot(key, snapshot);
  }

  async getDatabaseSnapshot(key: string): Promise<Uint8Array | undefined> {
    return this.databaseSync.getDatabaseSnapshot(key);
  }

  async getFileUrl(key: string, options: FileUrlOptions): Promise<string | undefined> {
    return this.urlResolver.getFileUrl(key, options);
  }

  private async refreshTasks(): Promise<void> {
    this.tasks = await this.listAttachmentTasks();
    this._onDidChangeTasks.fire();
  }

  private async putAttachmentObject(key: string, blob: Blob): Promise<void> {
    await this.testInjectionService.get('fileAsset.attachment.put');
    const mimeType = requireMimeFromKey(key);
    await this.objectStoreController
      .getObjectStore()
      .putAttachment(key, ensureBlobType(blob, mimeType));
  }

  private async buildImageUploadKeys(
    imageId: string,
    mimeType: string,
    withThumbnail: boolean,
  ): Promise<{ s3Key: string; thumbS3Key: string }> {
    const keys = syncStoragePath.image(imageId, mimeType);
    if (withThumbnail) return keys;
    return {
      s3Key: keys.s3Key,
      thumbS3Key: keys.thumbS3Key,
    };
  }
}
