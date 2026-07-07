export type MediaKind = 'image' | 'audio' | 'video';

// 各类型受支持的 MIME 白名单：MIME -> 落库扩展名。
const SUPPORTED_MIME_EXTENSIONS: Record<MediaKind, Record<string, string>> = {
  image: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  },
  audio: {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
  },
  video: {
    'video/mp4': 'mp4',
  },
};

// 不在白名单时的兜底扩展名（仅上传链路使用，入口已确保 MIME 合法）。
const FALLBACK_EXTENSION: Record<MediaKind, string> = {
  image: 'jpg',
  audio: 'webm',
  video: 'mp4',
};

const MIME_BY_EXTENSION = buildMimeByExtension();
const EXTRA_MIME_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
  mov: 'video/quicktime',
};

export function normalizeMime(mimeType: string | undefined): string {
  return mimeType?.split(';')[0].trim().toLowerCase() ?? '';
}

function buildMimeByExtension(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const mappings of Object.values(SUPPORTED_MIME_EXTENSIONS)) {
    for (const [mimeType, extension] of Object.entries(mappings)) {
      const existing = result[extension];
      if (existing && existing !== mimeType) {
        throw new Error(`Duplicate media extension mapping: ${extension}`);
      }
      result[extension] = mimeType;
    }
  }
  return result;
}

/**
 * 规范化并校验 MIME：去掉 `;codecs=...` 等参数后比对白名单，
 * 不在范围内直接抛错。仅用于文件入口。
 */
export function normalizeAndCheckMime(kind: MediaKind, mimeType: string | undefined): string {
  const normalized = normalizeMime(mimeType);
  if (!Object.prototype.hasOwnProperty.call(SUPPORTED_MIME_EXTENSIONS[kind], normalized)) {
    throw new Error(`Unsupported ${kind} mime type: ${normalized || '(empty)'}`);
  }
  return normalized;
}

/** 把 MIME 映射为落库扩展名；未知类型回退到该类型的默认扩展名。 */
export function mimeToExt(kind: MediaKind, mimeType: string | undefined): string {
  return SUPPORTED_MIME_EXTENSIONS[kind][normalizeMime(mimeType)] ?? FALLBACK_EXTENSION[kind];
}

/** Live Photo 原始视频素材扩展名；MOV 只用于原始素材或预览阶段临时源文件。 */
export function livePhotoVideoExt(mimeType: string | undefined): string {
  return normalizeMime(mimeType) === 'video/mp4' ? 'mp4' : 'mov';
}

/** 从附件 key 的扩展名反推 MIME；未知后缀不猜测。 */
export function mimeFromKey(key: string): string | undefined {
  const cleanKey = key.split(/[?#]/, 1)[0] ?? key;
  const filename = cleanKey.split('/').filter(Boolean).pop() ?? cleanKey;
  const dot = filename.lastIndexOf('.');
  if (dot < 0 || dot >= filename.length - 1) return undefined;
  const extension = filename.slice(dot + 1).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? EXTRA_MIME_BY_EXTENSION[extension];
}

/** 确保 Blob 带上指定 MIME；已是该类型或未指定 MIME 时原样返回。 */
export function ensureBlobType(blob: Blob, mimeType: string | undefined): Blob {
  if (!mimeType || blob.type === mimeType) return blob;
  return new Blob([blob], { type: mimeType });
}
