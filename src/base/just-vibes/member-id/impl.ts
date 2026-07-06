import { uniqueIdFromUuid } from '@/base/just-vibes/unique-id';

const MEMBER_ID_NAMESPACE = 'islet-membership';

// 会员 ID 由 recovery key 的哈希稳定派生：同一 recovery key 在任意设备、重装后都得到同一 ID，
// 因此付费权益跟随账号而非单机。先套一层带命名空间的哈希，与同步存储路径使用的 recoveryKeyHash
// 解耦，避免把同步身份直接透传给外部服务；再复用 unique-id 编码成便于展示的分段 ID。
export async function memberIdFromRecoveryKeyHash(recoveryKeyHash: string): Promise<string> {
  const normalized = recoveryKeyHash.trim().toLowerCase();
  if (!normalized) {
    throw new Error('recoveryKeyHash is required to derive a member ID');
  }
  const digest = await sha256Hex(`${MEMBER_ID_NAMESPACE}:${normalized}`);
  return uniqueIdFromUuid(digest.slice(0, 32));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
