import type {
  AudioAttachmentRecord,
  ImageAttachmentRecord,
  VideoAttachmentRecord,
} from '@/core/diary/type';
import type { ImageUploadResult, VideoUploadResult } from './fileAssetTypes';
import type { AttachmentUploadTaskRecord } from './uploadTaskStore';

export function imageUploadResultToAttachment(
  result: ImageUploadResult,
  notebookId: string,
): ImageAttachmentRecord {
  return {
    id: result.id,
    notebookId,
    type: 'image',
    mimeType: result.mimeType,
    size: result.size,
    s3Key: result.key,
    thumbS3Key: result.thumbKey,
    width: result.width,
    height: result.height,
    createdAt: result.createdAt,
  };
}

export function videoUploadResultToAttachment(
  result: VideoUploadResult,
  notebookId: string,
): VideoAttachmentRecord {
  return {
    id: result.id,
    notebookId,
    type: 'video',
    mimeType: result.mimeType,
    size: result.size,
    s3Key: result.key,
    thumbS3Key: result.thumbKey,
    width: result.width,
    height: result.height,
    duration: result.duration,
    createdAt: result.createdAt,
  };
}

export function imageAttachmentTaskToAttachment(
  task: AttachmentUploadTaskRecord,
): ImageAttachmentRecord {
  return {
    id: task.id,
    notebookId: task.notebookId,
    type: 'image',
    mimeType: task.mimeType,
    size: task.size,
    s3Key: task.s3Key,
    thumbS3Key: task.thumbS3Key,
    width: task.width,
    height: task.height,
    livePhoto: task.livePhoto,
    createdAt: task.createdAt,
  };
}

export function audioAttachmentTaskToAttachment(
  task: AttachmentUploadTaskRecord,
): AudioAttachmentRecord {
  return {
    id: task.id,
    notebookId: task.notebookId,
    type: 'audio',
    mimeType: task.mimeType,
    size: task.size,
    s3Key: task.s3Key,
    createdAt: task.createdAt,
    duration: task.duration ?? 0,
  };
}

export function videoAttachmentTaskToAttachment(
  task: AttachmentUploadTaskRecord,
): VideoAttachmentRecord {
  return {
    id: task.id,
    notebookId: task.notebookId,
    type: 'video',
    mimeType: task.mimeType,
    size: task.size,
    s3Key: task.s3Key,
    thumbS3Key: task.thumbS3Key,
    width: task.width,
    height: task.height,
    duration: task.duration ?? 0,
    createdAt: task.createdAt,
  };
}
