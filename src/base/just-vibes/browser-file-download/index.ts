// 浏览器文件下载模块。
// 通过临时 Blob URL + 隐藏 a[download] 触发浏览器原生下载。
export { downloadBrowserBlobFile, type BrowserBlobFileDownloadOptions } from './downloadBlobFile';
export { downloadBrowserTextFile, type BrowserTextFileDownloadOptions } from './downloadTextFile';
