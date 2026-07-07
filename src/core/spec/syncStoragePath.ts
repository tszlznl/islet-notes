import { livePhotoVideoExt, mimeToExt, normalizeMime } from '@/base/just-vibes/media-mime';
import type { SyncConfigRecord } from '@/core/diary/type';
import {
  attachmentShard,
  extractAttachmentStorageRef,
  normalizeUploadPathPrefix,
  requireRecoveryKeyHash,
} from '@/core/spec/syncStoragePathUtils';
import { nanoid } from 'nanoid';

type PrefixConfig = Pick<SyncConfigRecord, 'prefix'>;
type RemotePathConfig = Pick<SyncConfigRecord, 'prefix' | 'recoveryKeyHash'>;

interface AttachmentUploadKeys {
  s3Key: string;
  thumbS3Key: string;
}

interface LivePhotoOriginalKeys {
  stillS3Key: string;
  videoS3Key: string;
}

interface LivePhotoOriginalPathOptions {
  stillMimeType?: string;
  videoMimeType?: string;
}

export const syncStoragePath = {
  image(attachmentId: string, mimeType: string): AttachmentUploadKeys {
    const shard = attachmentShard(attachmentId);
    return {
      s3Key: `/attachments/${shard}/${attachmentId}.${mimeToExt('image', mimeType)}`,
      thumbS3Key: `/attachments/${shard}/${attachmentId}.thumb.jpg`,
    };
  },

  audio(attachmentId: string, mimeType: string): string {
    const shard = attachmentShard(attachmentId);
    return `/attachments/${shard}/${attachmentId}.${mimeToExt('audio', mimeType)}`;
  },

  video(attachmentId: string): AttachmentUploadKeys {
    const shard = attachmentShard(attachmentId);
    return {
      s3Key: `/attachments/${shard}/${attachmentId}.mp4`,
      thumbS3Key: `/attachments/${shard}/${attachmentId}.thumb.jpg`,
    };
  },

  livePhotoOriginals(
    attachmentId: string,
    options: LivePhotoOriginalPathOptions,
  ): LivePhotoOriginalKeys {
    const shard = attachmentShard(attachmentId);
    return {
      stillS3Key: `/attachments/${shard}/${attachmentId}.live-still.${livePhotoStillExt(options.stillMimeType)}`,
      videoS3Key: `/attachments/${shard}/${attachmentId}.live-video.${livePhotoVideoExt(options.videoMimeType)}`,
    };
  },

  remote: {
    healthcheck(config: PrefixConfig): string {
      const prefix = normalizeUploadPathPrefix(config.prefix);
      return `${prefix}_chat-diary-healthcheck.json`;
    },

    databaseMain(config: RemotePathConfig): string {
      const prefix = normalizeUploadPathPrefix(config.prefix);
      const recoveryKeyHash = requireRecoveryKeyHash(config);
      return `${prefix}${recoveryKeyHash}/main.db`;
    },

    databaseSnapshot(config: RemotePathConfig, date = new Date()): string {
      const prefix = normalizeUploadPathPrefix(config.prefix);
      const recoveryKeyHash = requireRecoveryKeyHash(config);
      const day = date.toISOString().slice(0, 10);
      const timestamp = date.toISOString().replace(/[:.]/g, '-');
      return `${prefix}${recoveryKeyHash}/snapshots/${day}/${timestamp}-${nanoid()}.db`;
    },

    attachmentObject(config: RemotePathConfig, attachmentRef: string): string {
      const normalizedRef = extractAttachmentStorageRef(attachmentRef);
      if (!normalizedRef) throw new Error('Attachment storage ref is required for upload.');
      return buildRemoteObjectKey(config, normalizedRef);
    },

    resolveAttachmentObjectKey(config: RemotePathConfig, key: string): string {
      const normalizedRef = extractAttachmentStorageRef(key);
      if (!normalizedRef) return key;
      return buildRemoteObjectKey(config, normalizedRef);
    },
  },
} as const;

function livePhotoStillExt(mimeType: string | undefined): string {
  switch (normalizeMime(mimeType)) {
    case 'image/heif':
      return 'heif';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    default:
      return 'heic';
  }
}

function buildRemoteObjectKey(config: RemotePathConfig, normalizedRef: string): string {
  const prefix = normalizeUploadPathPrefix(config.prefix);
  const recoveryKeyHash = requireRecoveryKeyHash(config);
  return `${prefix}${recoveryKeyHash}/${normalizedRef}`;
}
