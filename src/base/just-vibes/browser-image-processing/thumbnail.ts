export const IMAGE_THUMBNAIL_MIN_DIMENSION = 256;
export const IMAGE_THUMBNAIL_QUALITY = 0.8;

export interface BrowserImageThumbnailOptions {
  minDimension?: number;
  quality?: number;
}

export async function generateBrowserImageThumbnail(
  blob: Blob,
  options: BrowserImageThumbnailOptions = {},
): Promise<Blob> {
  const minDimension = options.minDimension ?? IMAGE_THUMBNAIL_MIN_DIMENSION;
  const quality = options.quality ?? IMAGE_THUMBNAIL_QUALITY;
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, minDimension / Math.min(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = createImageCanvas(width, height);
    const context = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!context) throw new Error('Canvas context is not available.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    return canvasToJpegBlob(canvas, quality);
  } finally {
    bitmap.close();
  }
}

function createImageCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number) {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to generate thumbnail.'));
      },
      'image/jpeg',
      quality,
    );
  });
}
