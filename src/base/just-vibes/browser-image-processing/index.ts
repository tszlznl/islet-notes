// 浏览器图片处理模块。
// 通过 createImageBitmap/canvas 读取图片尺寸，并生成稳定的 JPEG 缩略图。
export { readImageDimensions } from './dimensions';
export {
  generateBrowserImageThumbnail,
  IMAGE_THUMBNAIL_MIN_DIMENSION,
  IMAGE_THUMBNAIL_QUALITY,
  type BrowserImageThumbnailOptions,
} from './thumbnail';
