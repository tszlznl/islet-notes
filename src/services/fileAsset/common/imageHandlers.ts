import { base64ToBlob, blobToBase64 } from '@/base/just-vibes/binary-codec';
import {
  generateBrowserImageThumbnail,
  IMAGE_THUMBNAIL_MIN_DIMENSION,
  IMAGE_THUMBNAIL_QUALITY,
} from '@/base/just-vibes/browser-image-processing';
import { normalizeAndCheckMime } from '@/base/just-vibes/media-mime';
import { localize } from '@/nls';
import type { IHostService } from '@/services/native/common/hostService';

export const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

// 文件入口校验：MIME 不支持或体积超限时抛出本地化错误。
export function assertSupportedImage(file: Blob) {
  try {
    normalizeAndCheckMime('image', file.type);
  } catch {
    throw new Error(
      localize('attachment.image.unsupported', 'JPEG, PNG, and WebP images are supported.'),
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(localize('attachment.image.tooLarge', 'Images must be 50 MB or smaller.'));
  }
}

/** Messages the Capacitor Camera plugin throws when the user dismisses the picker/camera. */
export function isPickCancellation(message: string): boolean {
  return /cancel|no image (picked|selected)/i.test(message);
}

export async function generateImageThumbnail(
  blob: Blob,
  hostService?: IHostService,
): Promise<Blob> {
  const nativeThumbnail = await tryGenerateNativeImageThumbnail(blob, hostService);
  if (nativeThumbnail) return nativeThumbnail;
  return generateBrowserImageThumbnail(blob);
}

async function tryGenerateNativeImageThumbnail(
  blob: Blob,
  hostService: IHostService | undefined,
): Promise<Blob | undefined> {
  if (!hostService) return undefined;
  try {
    const imageBase64 = await blobToBase64(blob);
    if (hostService.caniuse('generateThumbnail')) {
      const result = await hostService.generateThumbnail({
        imageBase64,
        minDimension: IMAGE_THUMBNAIL_MIN_DIMENSION,
        quality: IMAGE_THUMBNAIL_QUALITY,
      });
      return base64ToBlob(result.imageBase64, result.mimeType || 'image/jpeg');
    }
  } catch {
    return undefined;
  }
}

export function inferMimeFromKey(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}
