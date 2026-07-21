import {
  HostFeature,
  HostCleanVideoRecordOptions,
  HostAttachmentFileOptions,
  HostFilesystemMkdirOptions,
  HostFilesystemPathOptions,
  HostFilesystemReaddirResult,
  HostFilesystemReadFileOptions,
  HostFilesystemReadFileResult,
  HostFilesystemRenameOptions,
  HostFilesystemRmdirOptions,
  HostFilesystemWriteFileOptions,
  HostGenerateThumbnailOptions,
  HostGenerateThumbnailResult,
  HostGalleryPick,
  HostExportBlobFileOptions,
  HostExportTextFileOptions,
  HostRouterType,
  HostMediaPickOptions,
  HostRequestOptions,
  HostResponse,
  HostSystemBarStyle,
  HostVideoPick,
  HostPrepareVideoUploadOptions,
  HostVideoPrepareResult,
  HostVideoRecordOptions,
  HostWriteAttachmentFileOptions,
  HostLivePhotoVideoPreviewOptions,
  ImagePickSource,
  IHostService,
} from '@/services/native/common/hostService';
import type { ITestInjectionService } from '@/services/e2e/common/testInjectionService';
import { blobToDataUrl } from '@/base/just-vibes/binary-codec';
import { writeBrowserClipboardText } from '@/base/just-vibes/browser-clipboard';
import {
  downloadBrowserBlobFile,
  downloadBrowserTextFile,
} from '@/base/just-vibes/browser-file-download';
import {
  assertSupportedImage,
  isPickCancellation,
} from '@/services/fileAsset/common/imageHandlers';
import {
  createBrowserHostFilesystem,
  type BrowserHostFilesystem,
} from '@/base/just-vibes/browser-host-filesystem';
import { readBrowserVideoInfo } from '@/base/just-vibes/browser-video-info';
import {
  createBrowserAttachmentBlobStore,
  type BrowserAttachmentBlobStore,
} from '@/base/just-vibes/browser-attachment-blob-store';
import { Event } from 'vscf/base/common/event';
import type { ZodType } from 'zod';
import { normalizeAndCheckMime } from '@/base/just-vibes/media-mime';
import { nanoid } from 'nanoid';

const BROWSER_PREFERENCE_STORAGE_PREFIX = 'CapacitorStorage.';

export class BrowserHostService implements IHostService {
  readonly _serviceBrand: undefined;
  readonly isNative = false;
  readonly platform = 'web' as const;
  readonly onBackButton = Event.None;
  readonly routerType: HostRouterType = 'browser';
  private readonly filesystem: BrowserHostFilesystem;
  private readonly attachmentBlobs: BrowserAttachmentBlobStore;
  private readonly videoObjectUrls = new Map<string, string>();
  private readonly livePhotoVideoObjectUrls = new Map<string, string>();

  constructor(
    useMemoryFilesystem = false,
    private readonly testInjectionService?: ITestInjectionService,
  ) {
    this.filesystem = createBrowserHostFilesystem(useMemoryFilesystem);
    this.attachmentBlobs = createBrowserAttachmentBlobStore(useMemoryFilesystem);
  }

  caniuse(feature: HostFeature): boolean {
    const injected = this.testInjectionService?.list()[`host.caniuse.${feature}`];
    if (injected?.action === 'mock' && typeof injected.value === 'boolean') {
      return injected.value;
    }

    switch (feature) {
      case 'videoUpload':
        return true;
      case 'videoTranscode':
        return false;
      case 'generateThumbnail':
      case 'webDavHttpRequest':
      case 'attachmentFileCache':
        return false;
    }
  }

  exitApp(): void {}

  vibrateShort(): void {
    navigator.vibrate?.(12);
  }

  async writeToClipboard(text: string): Promise<void> {
    await writeBrowserClipboardText(text);
  }

  async exportTextFile(options: HostExportTextFileOptions): Promise<void> {
    if (await this.tryInjectedTextFileExport(options)) return;
    downloadBrowserTextFile(options);
  }

  async exportBlobFile(options: HostExportBlobFileOptions): Promise<void> {
    if (await this.tryInjectedBlobFileExport(options)) return;
    downloadBrowserBlobFile(options);
  }

  async setBarStyle(_theme: HostSystemBarStyle): Promise<void> {}

  async pickImageBlob(source: ImagePickSource): Promise<Blob | undefined> {
    try {
      const injected = await this.testInjectionService?.get<Blob>('host.pickImageBlob');
      const blob = injected ?? (await pickBrowserImageFile(source));
      if (!blob) return undefined;
      assertSupportedImage(blob);
      return blob;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isPickCancellation(message)) return undefined;
      throw error;
    }
  }

  async pickMediaFromGallery(
    options?: HostMediaPickOptions,
  ): Promise<HostGalleryPick[] | undefined> {
    try {
      const injectedMedia = await this.testInjectionService?.get<
        HostGalleryPick | HostGalleryPick[]
      >('host.pickMediaFromGallery');
      if (injectedMedia) {
        const list = Array.isArray(injectedMedia) ? injectedMedia : [injectedMedia];
        return Promise.all(list.map((item) => this.normalizeGalleryPick(item)));
      }

      // Existing browser/e2e image upload tests inject this point. Keep it working after
      // enabling the richer media picker.
      const injectedImage = await this.testInjectionService?.get<Blob>('host.pickImageBlob');
      if (injectedImage) {
        assertSupportedImage(injectedImage);
        return [{ kind: 'image', blob: injectedImage }];
      }

      const injectedVideo = await this.testInjectionService?.get<Blob>('host.pickVideoBlob');
      if (injectedVideo) {
        return [
          {
            kind: 'video',
            video: await this.createHostVideoPick(injectedVideo, getCacheScope(options)),
          },
        ];
      }

      const files = await pickBrowserFiles({
        accept: 'image/*,video/mp4',
        multiple: (options?.limit ?? 1) > 1,
      });
      if (files.length === 0) return undefined;
      const picks: HostGalleryPick[] = [];
      for (const file of files.slice(0, Math.max(options?.limit ?? 1, 1))) {
        if (file.type.startsWith('image/')) {
          assertSupportedImage(file);
          picks.push({ kind: 'image', blob: file });
          continue;
        }
        normalizeAndCheckMime('video', file.type);
        picks.push({
          kind: 'video',
          video: await this.createHostVideoPick(file, getCacheScope(options)),
        });
      }
      return picks;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isPickCancellation(message)) return undefined;
      throw error;
    }
  }

  async recordVideo(options?: HostVideoRecordOptions): Promise<HostVideoPick | undefined> {
    try {
      const injected =
        (await this.testInjectionService?.get<Blob>('host.recordVideoBlob')) ??
        (await this.testInjectionService?.get<Blob>('host.pickVideoBlob'));
      const file = injected ?? (await pickBrowserFile({ accept: 'video/mp4', capture: true }));
      if (!file) return undefined;
      normalizeAndCheckMime('video', file.type);
      return this.createHostVideoPick(file, getCacheScope(options));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isPickCancellation(message)) return undefined;
      throw error;
    }
  }

  async prepareVideoUpload(
    options: HostPrepareVideoUploadOptions,
  ): Promise<HostVideoPrepareResult> {
    const source = await this.attachmentBlobs.read({
      scope: getCacheScope(options),
      key: options.sourcePath,
    });
    const webPath = this.getVideoObjectUrl(options.sourcePath, source);
    const info = await readBrowserVideoInfo(webPath);
    return {
      blob: source,
      thumbnail: info.thumbnail,
      width: info.width,
      height: info.height,
      duration: info.duration,
      size: source.size,
    };
  }

  async prepareLivePhotoVideoPreview(
    options: HostLivePhotoVideoPreviewOptions,
  ): Promise<string | undefined> {
    const existing = this.livePhotoVideoObjectUrls.get(options.cacheKey);
    if (existing) return existing;
    if (typeof URL.createObjectURL !== 'function') return undefined;
    const url = URL.createObjectURL(options.blob);
    this.livePhotoVideoObjectUrls.set(options.cacheKey, url);
    return url;
  }

  async cleanVideoRecord(options: HostCleanVideoRecordOptions): Promise<void> {
    const objectUrl = this.videoObjectUrls.get(options.sourcePath);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    this.videoObjectUrls.delete(options.sourcePath);
    await this.attachmentBlobs
      .delete({
        scope: getCacheScope(options),
        key: options.sourcePath,
      })
      .catch(() => undefined);
  }

  async writeAttachmentFile(options: HostWriteAttachmentFileOptions): Promise<void> {
    await this.attachmentBlobs.save({
      scope: options.scope,
      key: options.key,
      blob: options.blob,
    });
  }

  async readAttachmentFile(options: HostAttachmentFileOptions): Promise<Blob | undefined> {
    try {
      return await this.attachmentBlobs.read(options);
    } catch {
      return undefined;
    }
  }

  async getPreference<T>(key: string, schema?: ZodType<T>): Promise<T | undefined> {
    const value = localStorage.getItem(getBrowserPreferenceStorageKey(key));
    if (!value) return undefined;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed === null) return undefined;
      if (!schema) return parsed as T;
      const result = schema.safeParse(parsed);
      return result.success ? result.data : undefined;
    } catch {
      return undefined;
    }
  }

  async savePreference<T>(key: string, value: T): Promise<T> {
    localStorage.setItem(getBrowserPreferenceStorageKey(key), JSON.stringify(value));
    return value;
  }

  async clearPreference(key: string): Promise<void> {
    localStorage.removeItem(getBrowserPreferenceStorageKey(key));
  }

  async request(_options: HostRequestOptions): Promise<HostResponse> {
    throw new Error('WebDAV HTTP request is not supported on this platform.');
  }

  async generateThumbnail(
    _options: HostGenerateThumbnailOptions,
  ): Promise<HostGenerateThumbnailResult> {
    throw new Error('Generate thumbnail is not supported on this platform.');
  }

  async readdir(options: HostFilesystemPathOptions): Promise<HostFilesystemReaddirResult> {
    return this.filesystem.readdir(options);
  }

  async mkdir(options: HostFilesystemMkdirOptions): Promise<void> {
    await this.filesystem.mkdir(options);
  }

  async readFile(options: HostFilesystemReadFileOptions): Promise<HostFilesystemReadFileResult> {
    return this.filesystem.readFile(options);
  }

  async writeFile(options: HostFilesystemWriteFileOptions): Promise<void> {
    await this.filesystem.writeFile(options);
  }

  async rmdir(options: HostFilesystemRmdirOptions): Promise<void> {
    await this.filesystem.rmdir(options);
  }

  async deleteFile(options: HostFilesystemPathOptions): Promise<void> {
    await this.filesystem.deleteFile(options);
  }

  async rename(options: HostFilesystemRenameOptions): Promise<void> {
    await this.filesystem.rename(options);
  }

  private async normalizeGalleryPick(media: HostGalleryPick): Promise<HostGalleryPick> {
    if (media.kind === 'image') {
      assertSupportedImage(media.blob);
      return media;
    }
    return media;
  }

  private async createHostVideoPick(file: Blob, scope: string): Promise<HostVideoPick> {
    // 入口已校验为 MP4，这里直接存原片。
    const sourcePath = nanoid();
    await this.attachmentBlobs.save({
      scope,
      key: sourcePath,
      blob: file,
    });
    const webPath = this.getVideoObjectUrl(sourcePath, file);
    const info = await readBrowserVideoInfo(webPath);
    return {
      sourcePath,
      webPath,
      thumbnail: await blobToDataUrl(info.thumbnail),
      mimeType: 'video/mp4',
      size: file.size,
      width: info.width,
      height: info.height,
      durationMs: info.durationMs,
    };
  }

  private getVideoObjectUrl(sourcePath: string, source: Blob): string {
    const existing = this.videoObjectUrls.get(sourcePath);
    if (existing) return existing;
    if (typeof URL.createObjectURL !== 'function') return '';
    const next = URL.createObjectURL(source);
    this.videoObjectUrls.set(sourcePath, next);
    return next;
  }

  private async tryInjectedTextFileExport(options: HostExportTextFileOptions): Promise<boolean> {
    const injected = this.testInjectionService?.list()['host.exportTextFile'];
    if (!injected) return false;
    if (injected.action === 'delay') {
      await new Promise((resolve) => setTimeout(resolve, injected.delayMs));
      return true;
    }
    if (injected.action === 'throw') {
      throw new Error(injected.message ?? 'Injected test error: host.exportTextFile');
    }
    if (typeof injected.value === 'function') {
      await (injected.value as (options: HostExportTextFileOptions) => void | Promise<void>)(
        options,
      );
    }
    return true;
  }

  private async tryInjectedBlobFileExport(options: HostExportBlobFileOptions): Promise<boolean> {
    const injected = this.testInjectionService?.list()['host.exportBlobFile'];
    if (!injected) return false;
    if (injected.action === 'delay') {
      await new Promise((resolve) => setTimeout(resolve, injected.delayMs));
      return true;
    }
    if (injected.action === 'throw') {
      throw new Error(injected.message ?? 'Injected test error: host.exportBlobFile');
    }
    if (typeof injected.value === 'function') {
      await (injected.value as (options: HostExportBlobFileOptions) => void | Promise<void>)(
        options,
      );
    }
    return true;
  }
}

function getCacheScope(options?: { cacheScope?: string }): string {
  return options?.cacheScope || 'local';
}

function getBrowserPreferenceStorageKey(key: string): string {
  return `${BROWSER_PREFERENCE_STORAGE_PREFIX}${key}`;
}

function pickBrowserImageFile(source: ImagePickSource): Promise<File | undefined> {
  return pickBrowserFile({
    accept: 'image/*',
    capture: source === ImagePickSource.Camera,
  });
}

async function pickBrowserFile(options: {
  accept: string;
  capture?: boolean;
}): Promise<File | undefined> {
  const files = await pickBrowserFiles(options);
  return files[0];
}

function pickBrowserFiles(options: {
  accept: string;
  capture?: boolean;
  multiple?: boolean;
}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept;
    input.multiple = options.multiple ?? false;
    if (options.capture) {
      input.setAttribute('capture', 'environment');
    }
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '0';
    input.style.opacity = '0';

    let settled = false;
    let focusTimer: number | undefined;
    let pickerWasOpened = false;

    const cleanup = () => {
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      input.remove();
    };

    const settle = (files: File[]) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(files);
    };

    const onChange = () => {
      settle(Array.from(input.files ?? []));
    };
    const onCancel = () => {
      settle([]);
    };
    const onBlur = () => {
      pickerWasOpened = true;
    };
    const onFocus = () => {
      if (!pickerWasOpened) return;
      focusTimer = window.setTimeout(() => {
        if (!input.files?.length) settle([]);
      }, 300);
    };

    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}
