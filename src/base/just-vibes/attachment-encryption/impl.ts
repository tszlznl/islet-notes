// @islet-import-scope same-dir

import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from '@/base/just-vibes/binary-codec';

const ENCRYPTED_DATABASE_TYPE = 'chat-diary-db';
const ENCRYPTED_DATABASE_VERSION = 1;
const ENCRYPTED_ATTACHMENT_TYPE = 'chat-diary-attachment';
const ENCRYPTED_ATTACHMENT_VERSION = 1;
const ENCRYPTED_ATTACHMENT_MAGIC = new TextEncoder().encode('chat-diary-attachment-v1\n');
const ATTACHMENT_HEADER_LENGTH_BYTES = 4;
const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

interface EncryptedDatabasePayload {
  type: typeof ENCRYPTED_DATABASE_TYPE;
  version: typeof ENCRYPTED_DATABASE_VERSION;
  algorithm: 'AES-GCM';
  kdf: {
    name: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
  };
  keyHash: string;
  iv: string;
  ciphertext: string;
}

interface EncryptedAttachmentHeader {
  type: typeof ENCRYPTED_ATTACHMENT_TYPE;
  version: typeof ENCRYPTED_ATTACHMENT_VERSION;
  algorithm: 'AES-GCM';
  kdf: {
    name: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
  };
  keyHash: string;
  iv: string;
}

export interface AttachmentEncryptionTestVectorOptions {
  plaintext: Uint8Array;
  recoveryKey: string;
  salt: Uint8Array;
  iv: Uint8Array;
}

export async function deriveRecoveryKeyHash(recoveryKey: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    bytesToArrayBuffer(encodeRecoveryKey(recoveryKey)),
  );
  return bytesToHex(new Uint8Array(digest));
}

export async function encryptDatabaseSnapshot(
  snapshot: Uint8Array,
  recoveryKey: string,
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesKey(recoveryKey, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    key,
    bytesToArrayBuffer(snapshot),
  );
  const payload: EncryptedDatabasePayload = {
    type: ENCRYPTED_DATABASE_TYPE,
    version: ENCRYPTED_DATABASE_VERSION,
    algorithm: 'AES-GCM',
    kdf: {
      name: 'PBKDF2-SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    keyHash: await deriveRecoveryKeyHash(recoveryKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

export async function decryptDatabaseSnapshot(
  payloadBytes: Uint8Array,
  recoveryKey: string,
  expectedKeyHash?: string,
): Promise<Uint8Array> {
  const payload = parseEncryptedDatabasePayload(payloadBytes);
  if (!payload) return payloadBytes;

  const keyHash = await deriveRecoveryKeyHash(recoveryKey);
  if (expectedKeyHash && expectedKeyHash !== keyHash) {
    throw new Error('Recovery key hash does not match local configuration.');
  }
  if (payload.keyHash !== keyHash) {
    throw new Error('Recovery key does not match remote database.');
  }

  const salt = base64ToBytes(payload.kdf.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const key = await deriveAesKey(recoveryKey, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    key,
    bytesToArrayBuffer(ciphertext),
  );
  return new Uint8Array(plaintext);
}

export async function encryptAttachmentBlob(blob: Blob, recoveryKey: string): Promise<Blob> {
  const plaintext = new Uint8Array(await blob.arrayBuffer());
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const payload = await encryptAttachmentBytes(plaintext, recoveryKey, salt, iv);
  return new Blob([bytesToArrayBuffer(payload)], {
    type: 'application/octet-stream',
  });
}

export async function encryptAttachmentBytesForTest(
  options: AttachmentEncryptionTestVectorOptions,
): Promise<Uint8Array> {
  if (options.salt.byteLength !== SALT_BYTES) {
    throw new Error(`Attachment encryption salt must be ${SALT_BYTES} bytes.`);
  }
  if (options.iv.byteLength !== IV_BYTES) {
    throw new Error(`Attachment encryption IV must be ${IV_BYTES} bytes.`);
  }
  return encryptAttachmentBytes(options.plaintext, options.recoveryKey, options.salt, options.iv);
}

async function encryptAttachmentBytes(
  plaintext: Uint8Array,
  recoveryKey: string,
  salt: Uint8Array,
  iv: Uint8Array,
): Promise<Uint8Array> {
  const key = await deriveAesKey(recoveryKey, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
      key,
      bytesToArrayBuffer(plaintext),
    ),
  );
  const header: EncryptedAttachmentHeader = {
    type: ENCRYPTED_ATTACHMENT_TYPE,
    version: ENCRYPTED_ATTACHMENT_VERSION,
    algorithm: 'AES-GCM',
    kdf: {
      name: 'PBKDF2-SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    keyHash: await deriveRecoveryKeyHash(recoveryKey),
    iv: bytesToBase64(iv),
  };
  return serializeEncryptedAttachment(header, ciphertext);
}

export async function decryptAttachmentBlob(
  blob: Blob,
  recoveryKey: string,
  mimeType: string,
  expectedKeyHash?: string,
): Promise<Blob> {
  const payloadBytes = new Uint8Array(await blob.arrayBuffer());
  const payload = parseEncryptedAttachmentPayload(payloadBytes);
  if (!payload) return new Blob([bytesToArrayBuffer(payloadBytes)], { type: mimeType });

  const keyHash = await deriveRecoveryKeyHash(recoveryKey);
  if (expectedKeyHash && expectedKeyHash !== keyHash) {
    throw new Error('Recovery key hash does not match local configuration.');
  }
  if (payload.header.keyHash !== keyHash) {
    throw new Error('Recovery key does not match remote attachment.');
  }

  const salt = base64ToBytes(payload.header.kdf.salt);
  const iv = base64ToBytes(payload.header.iv);
  const key = await deriveAesKey(recoveryKey, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    key,
    bytesToArrayBuffer(payload.ciphertext),
  );
  return new Blob([plaintext], { type: mimeType });
}

function parseEncryptedDatabasePayload(
  payloadBytes: Uint8Array,
): EncryptedDatabasePayload | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return undefined;
  }

  if (!isRecord(parsed)) return undefined;
  if (parsed.type !== ENCRYPTED_DATABASE_TYPE) return undefined;
  if (parsed.version !== ENCRYPTED_DATABASE_VERSION) {
    throw new Error(`Unsupported encrypted database version: ${String(parsed.version)}`);
  }
  if (parsed.algorithm !== 'AES-GCM') throw new Error('Unsupported database encryption algorithm.');
  if (!isRecord(parsed.kdf) || parsed.kdf.name !== 'PBKDF2-SHA-256') {
    throw new Error('Unsupported database encryption KDF.');
  }
  if (parsed.kdf.iterations !== PBKDF2_ITERATIONS) {
    throw new Error('Unsupported database encryption KDF iterations.');
  }
  if (typeof parsed.kdf.salt !== 'string' || typeof parsed.keyHash !== 'string') {
    throw new Error('Invalid encrypted database metadata.');
  }
  if (typeof parsed.iv !== 'string' || typeof parsed.ciphertext !== 'string') {
    throw new Error('Invalid encrypted database payload.');
  }

  return parsed as unknown as EncryptedDatabasePayload;
}

function serializeEncryptedAttachment(
  header: EncryptedAttachmentHeader,
  ciphertext: Uint8Array,
): Uint8Array {
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const payload = new Uint8Array(
    ENCRYPTED_ATTACHMENT_MAGIC.byteLength +
      ATTACHMENT_HEADER_LENGTH_BYTES +
      headerBytes.byteLength +
      ciphertext.byteLength,
  );
  payload.set(ENCRYPTED_ATTACHMENT_MAGIC, 0);
  writeUint32(payload, ENCRYPTED_ATTACHMENT_MAGIC.byteLength, headerBytes.byteLength);
  payload.set(headerBytes, ENCRYPTED_ATTACHMENT_MAGIC.byteLength + ATTACHMENT_HEADER_LENGTH_BYTES);
  payload.set(
    ciphertext,
    ENCRYPTED_ATTACHMENT_MAGIC.byteLength + ATTACHMENT_HEADER_LENGTH_BYTES + headerBytes.byteLength,
  );
  return payload;
}

function parseEncryptedAttachmentPayload(
  payloadBytes: Uint8Array,
): { header: EncryptedAttachmentHeader; ciphertext: Uint8Array } | undefined {
  if (!startsWith(payloadBytes, ENCRYPTED_ATTACHMENT_MAGIC)) return undefined;
  if (
    payloadBytes.byteLength <
    ENCRYPTED_ATTACHMENT_MAGIC.byteLength + ATTACHMENT_HEADER_LENGTH_BYTES
  ) {
    throw new Error('Invalid encrypted attachment payload.');
  }
  const headerLength = readUint32(payloadBytes, ENCRYPTED_ATTACHMENT_MAGIC.byteLength);
  const headerStart = ENCRYPTED_ATTACHMENT_MAGIC.byteLength + ATTACHMENT_HEADER_LENGTH_BYTES;
  const headerEnd = headerStart + headerLength;
  if (payloadBytes.byteLength < headerEnd) {
    throw new Error('Invalid encrypted attachment header.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(payloadBytes.slice(headerStart, headerEnd)));
  } catch {
    throw new Error('Invalid encrypted attachment metadata.');
  }
  const header = validateEncryptedAttachmentHeader(parsed);
  return {
    header,
    ciphertext: payloadBytes.slice(headerEnd),
  };
}

function validateEncryptedAttachmentHeader(value: unknown): EncryptedAttachmentHeader {
  if (!isRecord(value)) throw new Error('Invalid encrypted attachment metadata.');
  if (value.type !== ENCRYPTED_ATTACHMENT_TYPE)
    throw new Error('Unsupported encrypted attachment type.');
  if (value.version !== ENCRYPTED_ATTACHMENT_VERSION) {
    throw new Error(`Unsupported encrypted attachment version: ${String(value.version)}`);
  }
  if (value.algorithm !== 'AES-GCM')
    throw new Error('Unsupported attachment encryption algorithm.');
  if (!isRecord(value.kdf) || value.kdf.name !== 'PBKDF2-SHA-256') {
    throw new Error('Unsupported attachment encryption KDF.');
  }
  if (value.kdf.iterations !== PBKDF2_ITERATIONS) {
    throw new Error('Unsupported attachment encryption KDF iterations.');
  }
  if (
    typeof value.kdf.salt !== 'string' ||
    typeof value.keyHash !== 'string' ||
    typeof value.iv !== 'string'
  ) {
    throw new Error('Invalid encrypted attachment metadata.');
  }
  return value as unknown as EncryptedAttachmentHeader;
}

async function deriveAesKey(recoveryKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    bytesToArrayBuffer(encodeRecoveryKey(recoveryKey)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: bytesToArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function encodeRecoveryKey(recoveryKey: string): Uint8Array {
  return new TextEncoder().encode(recoveryKey.trim());
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function startsWith(value: Uint8Array, prefix: Uint8Array): boolean {
  if (value.byteLength < prefix.byteLength) return false;
  for (let index = 0; index < prefix.byteLength; index += 1) {
    if (value[index] !== prefix[index]) return false;
  }
  return true;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function readUint32(source: Uint8Array, offset: number): number {
  return (
    source[offset] * 0x1000000 +
    ((source[offset + 1] ?? 0) << 16) +
    ((source[offset + 2] ?? 0) << 8) +
    (source[offset + 3] ?? 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
