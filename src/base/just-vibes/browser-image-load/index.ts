// 浏览器图片加载模块。
// 等待图片 URL 完成加载/解码，并为图片加载链路提供统一超时。
export { BROWSER_IMAGE_LOAD_TIMEOUT_MS, waitForImageLoad, withImageLoadTimeout } from './load';
