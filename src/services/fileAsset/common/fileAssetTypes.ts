import type { AttachmentUrlCacheRole } from '@/base/just-vibes/attachment-url-cache';

export interface UploadImageOptions {
  thumbnail?: boolean;
}

export interface ImageUploadResult {
  id: string;
  key: string;
  thumbKey?: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  createdAt: number;
}

export interface UploadVideoOptions {
  mimeType?: string;
}

export interface VideoUploadResult {
  id: string;
  key: string;
  thumbKey: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  createdAt: number;
}

export interface CreateImageAttachmentUploadTaskOptions {
  notebookId: string;
  file: Blob;
  /** iOS Live Photo 原始素材；不传时对 JPEG 自动做 Motion Photo 检测。 */
  livePhotoOriginal?: {
    still: Blob;
    stillMimeType: string;
    video: Blob;
    videoMimeType: string;
  };
  identityId?: string;
}

export interface CreateAudioAttachmentUploadTaskOptions {
  notebookId: string;
  file: Blob;
  duration: number;
  transcript?: string;
  identityId?: string;
}

export interface CreateVideoAttachmentUploadTaskOptions {
  notebookId: string;
  /** app 私有目录里的原视频副本；后台处理和重试都从这里读取。 */
  sourcePath: string;
  /** 是否按原画质上传（true 跳过转码）。 */
  originalQuality: boolean;
  /** 原片体积，单位字节。 */
  size: number;
  mimeType?: string;
  /** 原片宽高，未知时为 0，转码完成后回写。 */
  width?: number;
  height?: number;
  /** 原片时长，单位毫秒。 */
  durationMs?: number;
  /** 视频封面（data URL）。创建任务时用于处理中占位；转码完成后更新为处理后的封面，并用于上传重试。 */
  previewThumbnail?: string;
  identityId?: string;
}

export interface FileUrlOptions {
  role: AttachmentUrlCacheRole;
}
