// 浏览器剪贴板模块。
// 优先使用 Clipboard API，缺失时回退到临时 textarea + execCommand。
export { writeBrowserClipboardText } from './writeText';
