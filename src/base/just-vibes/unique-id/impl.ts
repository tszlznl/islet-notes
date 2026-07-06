const CROCKFORD_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export type RandomUuidProvider = () => string;

function encodeBase32(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid base32 source number: ${value}`);
  }

  if (value === 0) return '0';

  let rest = value;
  let encoded = '';
  while (rest > 0) {
    encoded = CROCKFORD_BASE32_ALPHABET[rest % 32] + encoded;
    rest = Math.floor(rest / 32);
  }
  return encoded;
}

function normalizeUuid(uuid: string): string {
  const normalized = uuid.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(normalized)) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  return normalized;
}

function getRandomUuid(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID !== 'function') {
    throw new Error('crypto.randomUUID is not available');
  }
  return randomUUID.call(globalThis.crypto);
}

export function uniqueIdFromUuid(uuid: string): string {
  const normalized = normalizeUuid(uuid);
  const parts: string[] = [];

  for (let index = 0; index < normalized.length; index += 8) {
    const numberPart = Number.parseInt(normalized.slice(index, index + 8), 16);
    parts.push(encodeBase32(numberPart));
  }

  return parts.join('-');
}

export function createUniqueId(randomUuid: RandomUuidProvider = getRandomUuid): string {
  return uniqueIdFromUuid(randomUuid());
}
