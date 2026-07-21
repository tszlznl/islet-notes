export const PROFILE_ATTACHMENT_NOTEBOOK_ID = 'profile';

export const IDENTITY_ATTACHMENT_NOTEBOOK_ID = 'identity';

export type IdentityMessagePosition = 'left' | 'right';

export interface IdentityRecord {
  id: string;
  name: string;
  avatarAttachmentId?: string;
  /** 聊天消息的显示位置；读取时缺失或非法值一律按 'right' 容错。 */
  messagePosition: IdentityMessagePosition;
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
