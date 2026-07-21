import type { IHostService } from '@/services/native/common/hostService';
import type { LivePhotoAttachmentRecord } from '@/core/diary/type';
import { Emitter, Event } from 'vscf/base/common/event';

export type AttachmentUploadStatus = 'pending' | 'uploading' | 'failed' | 'done';
export type AttachmentUploadPurpose = 'entry' | 'notebook-avatar';
export type AttachmentUploadErrorCode =
  | 'local-file-missing'
  | 'upload-interrupted'
  | 'upload-failed';

export const MAX_ATTACHMENT_UPLOAD_TASKS = 20;
export const LOCAL_FILE_MISSING_ERROR_CODE: AttachmentUploadErrorCode = 'local-file-missing';

interface AttachmentUploadTaskRecordBase {
  id: string;
  notebookId: string;
  purpose?: AttachmentUploadPurpose;
  type: 'image' | 'audio' | 'video';
  s3Key: string;
  thumbS3Key: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  duration?: number;
  transcript?: string;
  previewThumbnail?: string;
  /** 发送该附件消息时选中的身份，落库为 entry.identityId。 */
  identityId?: string;
  /** 发送该附件消息时时光机选中的时间，落库为 entry.displayAt。 */
  displayAt?: number;
  livePhoto?: LivePhotoAttachmentRecord;
  status: AttachmentUploadStatus;
  queueSeq: number;
  createdAt: number;
  updatedAt: number;
  errorCode?: AttachmentUploadErrorCode;
  errorMessage?: string;
}

export interface BlobAttachmentUploadTaskRecord extends AttachmentUploadTaskRecordBase {
  type: 'image' | 'audio';
}

export interface VideoAttachmentUploadTaskRecord extends AttachmentUploadTaskRecordBase {
  type: 'video';
  /** app 私有目录里的原视频副本；每次上传/重试都基于它重新准备上传 payload。 */
  sourcePath: string;
  /** 视频是否按原画质上传（true 跳过转码，仅做必要处理）。 */
  originalQuality: boolean;
}

export type AttachmentUploadTaskRecord =
  | BlobAttachmentUploadTaskRecord
  | VideoAttachmentUploadTaskRecord;

export interface AttachmentUploadTaskStore {
  readonly onDidChange: Event<void>;
  init(scope?: string): Promise<void>;
  addTask(task: AttachmentUploadTaskRecord): Promise<void>;
  updateTask(task: AttachmentUploadTaskRecord): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  getTask(taskId: string): Promise<AttachmentUploadTaskRecord | undefined>;
  listTasks(): Promise<AttachmentUploadTaskRecord[]>;
  listTasksByNotebook(notebookId: string): Promise<AttachmentUploadTaskRecord[]>;
  nextPendingTask(): Promise<AttachmentUploadTaskRecord | undefined>;
  resetActiveTasks(): Promise<void>;
  getNextQueueSeq(): Promise<number>;
}

export abstract class BaseAttachmentUploadStore implements AttachmentUploadTaskStore {
  protected readonly _onDidChange = new Emitter<void>();
  readonly onDidChange = this._onDidChange.event;

  abstract init(scope?: string): Promise<void>;
  abstract addTask(task: AttachmentUploadTaskRecord): Promise<void>;
  abstract updateTask(task: AttachmentUploadTaskRecord): Promise<void>;
  abstract deleteTask(taskId: string): Promise<void>;
  abstract getTask(taskId: string): Promise<AttachmentUploadTaskRecord | undefined>;
  abstract listTasks(): Promise<AttachmentUploadTaskRecord[]>;

  async listTasksByNotebook(notebookId: string): Promise<AttachmentUploadTaskRecord[]> {
    return (await this.listTasks()).filter(
      (task) => task.notebookId === notebookId && (task.purpose ?? 'entry') === 'entry',
    );
  }

  async nextPendingTask(): Promise<AttachmentUploadTaskRecord | undefined> {
    return (await this.listTasks()).find((task) => task.status === 'pending');
  }

  async resetActiveTasks(): Promise<void> {
    const tasks = await this.listTasks();
    for (const task of tasks.filter(
      (item) => item.status === 'uploading' || item.status === 'pending',
    )) {
      await this.updateTask({
        ...task,
        status: 'failed',
        errorCode: 'upload-interrupted',
        errorMessage: 'Upload was interrupted.',
      });
    }
  }

  async getNextQueueSeq(): Promise<number> {
    return (await this.listTasks()).reduce((max, task) => Math.max(max, task.queueSeq), 0) + 1;
  }
}

export class HostAttachmentUploadStore extends BaseAttachmentUploadStore {
  private storagePath = getStoragePath('local');
  private tasks: AttachmentUploadTaskRecord[] = [];

  constructor(private readonly hostService: IHostService) {
    super();
  }

  async init(scope = 'local'): Promise<void> {
    this.storagePath = getStoragePath(scope);
    this.tasks = await this.readPersistedTasks();
  }

  async addTask(task: AttachmentUploadTaskRecord): Promise<void> {
    if (this.tasks.filter((item) => item.status !== 'done').length >= MAX_ATTACHMENT_UPLOAD_TASKS) {
      throw new Error('Too many pending uploads.');
    }
    this.tasks = [...this.tasks.filter((item) => item.id !== task.id), task].sort(compareTasks);
    await this.persist();
    this._onDidChange.fire();
  }

  async updateTask(task: AttachmentUploadTaskRecord): Promise<void> {
    const nextTask = { ...task, updatedAt: Date.now() };
    const previous = this.tasks.find((item) => item.id === task.id);
    this.tasks = [...this.tasks.filter((item) => item.id !== task.id), nextTask].sort(compareTasks);
    if (shouldPersistTaskUpdate(previous, nextTask)) {
      await this.persist();
    }
    this._onDidChange.fire();
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    await this.persist();
    this._onDidChange.fire();
  }

  async getTask(taskId: string): Promise<AttachmentUploadTaskRecord | undefined> {
    return this.tasks.find((task) => task.id === taskId);
  }

  async listTasks(): Promise<AttachmentUploadTaskRecord[]> {
    return [...this.tasks].sort(compareTasks);
  }

  private async readPersistedTasks(): Promise<AttachmentUploadTaskRecord[]> {
    try {
      const { data } = await this.hostService.readFile({ path: this.storagePath });
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return normalizePersistedTasks(parsed);
    } catch {
      return [];
    }
  }

  private async persist(): Promise<void> {
    try {
      await this.hostService
        .mkdir({
          path: getStorageDir(this.storagePath),
          recursive: true,
        })
        .catch(() => undefined);
      await this.hostService.writeFile({
        path: this.storagePath,
        data: JSON.stringify(this.tasks.slice(0, MAX_ATTACHMENT_UPLOAD_TASKS)),
      });
    } catch {
      // If the host filesystem is unavailable or full, keep the in-memory queue for this session.
    }
  }
}

function normalizePersistedTasks(value: unknown): AttachmentUploadTaskRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isAttachmentUploadTaskRecord)
    .sort(compareTasks)
    .slice(0, MAX_ATTACHMENT_UPLOAD_TASKS);
}

function getStoragePath(scope: string): string {
  return `attachment-uploads/${scope}/tasks.json`;
}

function getStorageDir(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

function compareTasks(left: AttachmentUploadTaskRecord, right: AttachmentUploadTaskRecord): number {
  return left.queueSeq - right.queueSeq;
}

function shouldPersistTaskUpdate(
  previous: AttachmentUploadTaskRecord | undefined,
  next: AttachmentUploadTaskRecord,
): boolean {
  return (
    !previous ||
    previous.status !== next.status ||
    previous.errorCode !== next.errorCode ||
    previous.errorMessage !== next.errorMessage ||
    previous.transcript !== next.transcript ||
    getTaskSourcePath(previous) !== getTaskSourcePath(next) ||
    previous.previewThumbnail !== next.previewThumbnail ||
    previous.width !== next.width ||
    previous.height !== next.height ||
    previous.duration !== next.duration ||
    previous.size !== next.size ||
    JSON.stringify(previous.livePhoto) !== JSON.stringify(next.livePhoto)
  );
}

function isAttachmentUploadTaskRecord(value: unknown): value is AttachmentUploadTaskRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<AttachmentUploadTaskRecordBase> & {
    sourcePath?: unknown;
    originalQuality?: unknown;
  };
  return (
    typeof record.id === 'string' &&
    typeof record.notebookId === 'string' &&
    (record.type === 'image' || record.type === 'audio' || record.type === 'video') &&
    typeof record.s3Key === 'string' &&
    typeof record.thumbS3Key === 'string' &&
    typeof record.mimeType === 'string' &&
    typeof record.size === 'number' &&
    typeof record.width === 'number' &&
    typeof record.height === 'number' &&
    (record.status === 'pending' ||
      record.status === 'uploading' ||
      record.status === 'failed' ||
      record.status === 'done') &&
    typeof record.queueSeq === 'number' &&
    typeof record.createdAt === 'number' &&
    typeof record.updatedAt === 'number' &&
    (record.livePhoto === undefined || isLivePhotoAttachmentRecord(record.livePhoto)) &&
    (record.type === 'video'
      ? typeof record.sourcePath === 'string' && typeof record.originalQuality === 'boolean'
      : true)
  );
}

function isLivePhotoAttachmentRecord(value: unknown): value is LivePhotoAttachmentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<LivePhotoAttachmentRecord>;
  if (record.kind !== 'motion-jpeg' && record.kind !== 'ios-paired-files') {
    return false;
  }
  return (
    typeof record.stillS3Key === 'string' &&
    typeof record.stillMimeType === 'string' &&
    (record.videoS3Key === undefined || typeof record.videoS3Key === 'string') &&
    (record.videoMimeType === undefined || typeof record.videoMimeType === 'string')
  );
}

function getTaskSourcePath(task: AttachmentUploadTaskRecord | undefined): string | undefined {
  if (!task || task.type !== 'video') return undefined;
  return task.sourcePath;
}
