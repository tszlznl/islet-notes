import type { CssMessageColor } from '@/base/just-vibes/message-color';

export type { CssMessageColor } from '@/base/just-vibes/message-color';

export const PROFILE_ATTACHMENT_NOTEBOOK_ID = 'profile';

export const IDENTITY_ATTACHMENT_NOTEBOOK_ID = 'identity';

export type IdentityMessagePosition = 'left' | 'right';

/** 当前版本只支持经过界面校验、且绑定实际浅色或深色主题的 CSS background。 */
export type KnownMessageColor = CssMessageColor;

/** 存储形态对未来的背景类型开放：未知 type 原样保留（老版本不丢新版本数据），渲染层兜底为默认气泡。 */
export type MessageColor = KnownMessageColor | { type: string & {} };

export function isKnownMessageColor(style: MessageColor): style is KnownMessageColor {
  if (style.type !== 'css') return false;
  const { value, theme, textColor } = style as CssMessageColor;
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    (theme === 'light' || theme === 'dark') &&
    (textColor === 'auto' || textColor === 'black' || textColor === 'white')
  );
}

/** 读取存储中的消息颜色：仅要求是带非空字符串 type 的对象，其余字段原样透传。 */
export function readMessageColorValue(raw: unknown): MessageColor | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { type } = raw as { type?: unknown };
  if (typeof type !== 'string' || !type) return undefined;
  return raw as MessageColor;
}

export interface IdentityRecord {
  id: string;
  name: string;
  avatarAttachmentId?: string;
  /** 聊天消息的显示位置；读取时缺失或非法值一律按 'right' 容错。 */
  messagePosition: IdentityMessagePosition;
  /** 消息颜色；缺失或渲染层无法识别时使用默认气泡。 */
  messageColor?: MessageColor;
  createdAt: number;
  updatedAt: number;
  /** 归档时间。身份只能归档不能删除，与软删除 deletedAt 区分。 */
  archivedAt?: number;
}

export interface NotebookRecord {
  id: string;
  name: string;
  avatarAttachmentId?: string;
  chatBackgroundAttachmentId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface ProfileRecord {
  name?: string;
  avatarAttachmentId?: string;
  /** 本人消息的消息颜色；缺失或渲染层无法识别时使用默认气泡。 */
  messageColor?: MessageColor;
  updatedAt?: number;
}

export type KnownDiaryEntryType = 'text' | 'attachment';
export type DiaryEntryType = KnownDiaryEntryType | (string & {});

export function isKnownDiaryEntryType(type: string): type is KnownDiaryEntryType {
  return type === 'text' || type === 'attachment';
}

export interface DiaryEntryRecord {
  id: string;
  notebookId: string;
  type: DiaryEntryType;
  text?: string;
  attachmentId?: string;
  identityId?: string;
  /** 被引用消息的 entry id；被引用消息删除后引用块降级为占位文案。 */
  replyToEntryId?: string;
  createdAt: number;
  /** 用户手动设置的展示/排序时间；缺失时使用 createdAt。 */
  displayAt?: number;
  updatedAt: number;
  deletedAt?: number;
  externalSource?: string;
  externalId?: string;
}

export interface AttachmentRecordBase {
  id: string;
  notebookId: string;
  mimeType: string;
  size: number;
  s3Key?: string;
  thumbS3Key?: string;
  createdAt: number;
  deletedAt?: number;
}

export type LivePhotoStorageKind = 'motion-jpeg' | 'ios-paired-files';

export interface LivePhotoAttachmentRecord {
  kind: LivePhotoStorageKind;
  /** 原始静态图 key；Motion Photo JPEG 与 s3Key 相同，iOS 通常是 HEIC 原件。 */
  stillS3Key: string;
  stillMimeType: string;
  /** 原始视频 key；iOS 通常是 MOV。Motion Photo JPEG 不单独存视频。 */
  videoS3Key?: string;
  videoMimeType?: string;
}

export interface ImageAttachmentRecord extends AttachmentRecordBase {
  type: 'image';
  width: number;
  height: number;
  livePhoto?: LivePhotoAttachmentRecord;
}

export interface AudioAttachmentRecord extends AttachmentRecordBase {
  type: 'audio';
  /** 录音时长，单位秒。MediaRecorder 容器元数据不稳定，使用录制计时结果。 */
  duration: number;
}

export interface VideoAttachmentRecord extends AttachmentRecordBase {
  type: 'video';
  width: number;
  height: number;
  /** 视频时长，单位秒。 */
  duration: number;
}

export interface UnknownAttachmentRecord extends AttachmentRecordBase {
  type: 'unknown';
  originalType?: string;
}

export type AttachmentRecord =
  | ImageAttachmentRecord
  | AudioAttachmentRecord
  | VideoAttachmentRecord
  | UnknownAttachmentRecord;

export type SyncProvider = 's3' | 'webdav';

export interface S3ConfigRecord {
  provider: 's3';
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
  forcePathStyle: boolean;
  recoveryKey?: string;
  recoveryKeyHash?: string;
  updatedAt: number;
}

export interface WebDAVConfigRecord {
  provider: 'webdav';
  url: string;
  username: string;
  password: string;
  prefix: string;
  recoveryKey?: string;
  recoveryKeyHash?: string;
  updatedAt: number;
}

export type SyncConfigRecord = S3ConfigRecord | WebDAVConfigRecord;

export interface DiaryModelData {
  version: Record<string, number>;
  profile: ProfileRecord;
  notebookOrder: string[];
  notebooks: NotebookRecord[];
  notebookMap: Map<string, NotebookRecord>;
  entries: DiaryEntryRecord[];
  entryMap: Map<string, DiaryEntryRecord>;
  attachments: AttachmentRecord[];
  attachmentMap: Map<string, AttachmentRecord>;
  identities: IdentityRecord[];
  identityMap: Map<string, IdentityRecord>;
}

export interface CreateTextEntryOptions {
  notebookId: string;
  text: string;
  createdAt?: number;
  /** 创建时即指定展示/排序时间（时光机）；与 createdAt 相同时不落库。 */
  displayAt?: number;
  identityId?: string;
  /** 引用的消息 entry id。 */
  replyToEntryId?: string;
  externalSource?: string;
  externalId?: string;
}

export interface CreateAttachmentEntryOptions {
  attachment: AttachmentRecord;
  createdAt: number;
  /** 创建时即指定展示/排序时间（时光机）；与 createdAt 相同时不落库。 */
  displayAt?: number;
  text?: string;
  identityId?: string;
  externalSource?: string;
  externalId?: string;
}
