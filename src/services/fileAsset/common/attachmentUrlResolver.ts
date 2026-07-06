import {
  createAttachmentUrlCache,
  type AttachmentUrlCache,
} from '@/base/just-vibes/attachment-url-cache';
import { mimeFromKey } from '@/base/just-vibes/media-mime';
import {
  getPresignedGetSigningDate,
  IMMUTABLE_ATTACHMENT_CACHE_CONTROL,
  PRESIGNED_GET_EXPIRES_IN,
} from '@/base/just-vibes/object-storage-presigned-url-policy';
import type { AttachmentLocalCache } from './attachmentLocalCache';
import type { FileAssetObjectStoreController } from './fileAssetObjectStoreController';
import type { FileUrlOptions } from './fileAssetTypes';

export class AttachmentUrlResolver {
  private readonly fileUrlLoads = new Map<string, Promise<void>>();
  private readonly fileUrlCache: AttachmentUrlCache = createAttachmentUrlCache();

  constructor(
    private readonly localCache: AttachmentLocalCache,
    private readonly objectStoreController: FileAssetObjectStoreController,
    private readonly getScope: () => string,
  ) {}

  async getFileUrl(key: string, options: FileUrlOptions): Promise<string | undefined> {
    if (!mimeFromKey(key)) return undefined;
    const cached = await this.localCache.read(key);
    if (cached) {
      return this.acquire(key, cached, options);
    }

    const loadKey = key;
    const existingLoad = this.fileUrlLoads.get(loadKey);
    if (existingLoad) {
      await existingLoad;
      const loaded = await this.localCache.read(key);
      return loaded ? this.acquire(key, loaded, options) : undefined;
    }

    const load = this.loadRemoteFileToCache(key).finally(() => {
      this.fileUrlLoads.delete(loadKey);
    });
    this.fileUrlLoads.set(loadKey, load);
    await load;
    const loaded = await this.localCache.read(key);
    return loaded ? this.acquire(key, loaded, options) : undefined;
  }

  private acquire(key: string, blob: Blob, options: FileUrlOptions): string {
    return this.fileUrlCache.acquire({
      ...options,
      scope: this.getScope(),
      key,
      blob,
    });
  }

  private async loadRemoteFileToCache(key: string): Promise<void> {
    const mimeType = mimeFromKey(key);
    if (!mimeType) return;
    const blob = await this.objectStoreController.getObjectStore().getAttachment(key, mimeType, {
      expiresIn: PRESIGNED_GET_EXPIRES_IN,
      signingDate: getPresignedGetSigningDate(),
      responseCacheControl: IMMUTABLE_ATTACHMENT_CACHE_CONTROL,
    });
    if (!blob) return;
    await this.localCache.write(key, blob);
  }
}
