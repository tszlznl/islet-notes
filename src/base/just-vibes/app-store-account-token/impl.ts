const APP_STORE_ACCOUNT_TOKEN_NAMESPACE = 'islet-app-store-account';

/** 为 StoreKit 的 appAccountToken 派生稳定 UUID，与 cloud 端算法保持一致。 */
export async function appStoreAccountTokenFromMemberId(memberId: string): Promise<string> {
  const normalized = memberId.trim().toUpperCase();
  if (!normalized) {
    throw new Error('memberId is required to derive an App Store account token');
  }

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${APP_STORE_ACCOUNT_TOKEN_NAMESPACE}:${normalized}`),
  );
  const bytes = new Uint8Array(digest).slice(0, 16);
  // 使用 RFC 4122 的 version 5 / variant 1 形式，确保 StoreKit 可按 UUID 接收。
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
