import { SyncConfigRecord } from '@/core/diary/type';
import { normalizeUploadPrefix } from '@/core/spec/syncStoragePathUtils';
import { LOCAL_DIARY_SCOPE_ID } from '@/services/diary/common/storage';
import { deriveRecoveryKeyHash } from '@/base/just-vibes/attachment-encryption';
import { definePreference } from './preference';
import { z } from 'zod';

export const MEMORY_STORAGE_SCOPE_KEY = 'memory';

export const CalendarDisplayOrderSchema = z.enum(['newest-first', 'oldest-first']);
export type CalendarDisplayOrder = z.infer<typeof CalendarDisplayOrderSchema>;
export const CalendarDisplayOrderPreference = definePreference({
  channel: 'host',
  key: 'calendar-display-order',
  schema: CalendarDisplayOrderSchema,
  defaultValue: 'oldest-first',
});

export const MessageLinkDetectionPreference = definePreference({
  channel: 'host',
  key: 'message-link-detection',
  schema: z.boolean(),
  defaultValue: true,
});

export const PageTransitionPreference = definePreference({
  channel: 'host',
  key: 'page-transition',
  schema: z.boolean(),
  defaultValue: !globalThis.__ISLET_ANDROID_ENVIRONMENT__?.isInstalledByZhuoyi(),
});

export type AppStorageMode = 'persistent' | 'memory';

export const SyncConfigSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('s3'),
    endpoint: z.string(),
    region: z.string(),
    bucket: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    prefix: z.string(),
    forcePathStyle: z.boolean(),
    recoveryKey: z.string().optional(),
    recoveryKeyHash: z.string().optional(),
    updatedAt: z.number(),
  }),
  z.object({
    provider: z.literal('webdav'),
    url: z.string(),
    username: z.string(),
    password: z.string(),
    prefix: z.string(),
    recoveryKey: z.string().optional(),
    recoveryKeyHash: z.string().optional(),
    updatedAt: z.number(),
  }),
]);

export const SyncConfigPreference = definePreference({
  channel: 'host',
  key: 'cloud-sync',
  schema: SyncConfigSchema.optional(),
  defaultValue: undefined,
});

export function createSyncConfigPreference(
  config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
): SyncConfigRecord {
  return {
    ...config,
    updatedAt: Date.now(),
  } as SyncConfigRecord;
}

export function stringifySyncConfigPreference(config: SyncConfigRecord): string {
  return JSON.stringify(config);
}

export async function getAppStorageScopeKey(
  mode: AppStorageMode,
  config: SyncConfigRecord | undefined,
): Promise<string> {
  if (mode === 'memory') return MEMORY_STORAGE_SCOPE_KEY;
  if (!config) return LOCAL_DIARY_SCOPE_ID;
  const scope = await getSyncStorageScope(config);
  return scope ? `sync-${scope}` : LOCAL_DIARY_SCOPE_ID;
}

export async function getSyncStorageScope(config: SyncConfigRecord): Promise<string | undefined> {
  const recoveryKeyHash = await getRecoveryKeyHash(config);
  if (!recoveryKeyHash) return undefined;

  const identity = JSON.stringify([
    config.provider,
    ...getRemoteIdentity(config),
    normalizeUploadPrefix(config.prefix),
    recoveryKeyHash.trim().toLowerCase(),
  ]);
  return (await sha256Hex(identity)).slice(0, 32);
}

function getRemoteIdentity(config: SyncConfigRecord): string[] {
  if (config.provider === 'webdav') {
    return [normalizeRemoteUrl(config.url)];
  }
  return [normalizeRemoteUrl(config.endpoint), config.bucket.trim()];
}

function normalizeRemoteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  try {
    const url = new URL(trimmed);
    url.hash = '';
    url.search = '';
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

async function getRecoveryKeyHash(config: SyncConfigRecord): Promise<string | undefined> {
  const savedHash = config.recoveryKeyHash?.trim();
  if (savedHash) return savedHash;

  const recoveryKey = config.recoveryKey?.trim();
  if (!recoveryKey) return undefined;
  return deriveRecoveryKeyHash(recoveryKey);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
