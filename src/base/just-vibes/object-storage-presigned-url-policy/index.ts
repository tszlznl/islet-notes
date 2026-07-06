// 对象存储预签名下载策略模块。
// 统一下载 URL 的有效期、签名窗口和不可变附件缓存头。
export {
  IMMUTABLE_ATTACHMENT_CACHE_CONTROL,
  PRESIGNED_GET_EXPIRES_IN,
  PRESIGNED_GET_SIGNING_WINDOW_MS,
  getPresignedGetSigningDate,
} from './downloadPolicy';
