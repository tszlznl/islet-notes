import { waitForImageLoad, withImageLoadTimeout } from '@/base/just-vibes/browser-image-load';
import { FileUrlOptions, IFileAssetService } from '@/services/fileAsset/common/fileAssetService';

export async function loadImageUrl(
  fileAssetService: IFileAssetService,
  key: string,
  options: FileUrlOptions,
): Promise<string | undefined> {
  const url = await withImageLoadTimeout(fileAssetService.getFileUrl(key, options));
  if (!url) return undefined;
  try {
    await waitForImageLoad(url);
    return url;
  } catch {
    throw new Error('Failed to load image.');
  }
}
