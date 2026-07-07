import { readBytes } from './jpeg';

const FTYP = 0x66747970;
const MAX_TAIL_SCAN = 8 * 1024 * 1024;

export async function findMp4StartFromTail(blob: Blob): Promise<number | undefined> {
  const start = Math.max(0, blob.size - MAX_TAIL_SCAN);
  const bytes = await readBytes(blob, start, blob.size);
  for (let index = 4; index <= bytes.length - 4; index++) {
    if (readUint32(bytes, index) !== FTYP) continue;
    const boxStart = index - 4;
    const size = readUint32(bytes, boxStart);
    if (size < 8 || boxStart + size > bytes.length) continue;
    return start + boxStart;
  }
  return undefined;
}

export function startsWithFtyp(bytes: Uint8Array): boolean {
  return bytes.length >= 8 && readUint32(bytes, 4) === FTYP;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
  );
}
