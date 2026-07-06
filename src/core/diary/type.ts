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
  createdAt: number;
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

export interface ImageAttachmentRecord extends AttachmentRecordBase {
  type: 'image';
  width: number;
  height: number;
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
  identityId?: string;
  externalSource?: string;
  externalId?: string;
}

export interface CreateAttachmentEntryOptions {
  attachment: AttachmentRecord;
  createdAt: number;
  text?: string;
  identityId?: string;
  externalSource?: string;
  externalId?: string;
}
