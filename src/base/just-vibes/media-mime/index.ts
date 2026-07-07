// 媒体 MIME 校验模块。
// 集中维护图片/音频/视频的受支持 MIME 白名单：在文件入口用 normalizeAndCheckMime
// 规范化并校验 MIME（不支持即抛错），落库时用 mimeToExt 把 MIME 映射为扩展名；
// 读取链路用 mimeFromKey 从附件 key 反推 MIME，用 ensureBlobType 给 Blob 补上正确 MIME。
export {
  ensureBlobType,
  livePhotoVideoExt,
  mimeFromKey,
  mimeToExt,
  normalizeMime,
  normalizeAndCheckMime,
  type MediaKind,
} from './impl';
