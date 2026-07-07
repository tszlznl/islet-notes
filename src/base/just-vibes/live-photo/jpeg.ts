export interface JpegSegment {
  marker: number;
  start: number;
  end: number;
  payloadStart: number;
  payloadEnd: number;
}

const SOI = 0xffd8;
const SOS = 0xffda;
const EOI = 0xffd9;

export async function readBytes(blob: Blob, start = 0, end = blob.size): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(start, end).arrayBuffer());
}

export async function readJpegSegments(blob: Blob): Promise<JpegSegment[]> {
  const bytes = await readBytes(blob);
  if (bytes.length < 2 || readUint16(bytes, 0) !== SOI) return [];

  const segments: JpegSegment[] = [];
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = readUint16(bytes, offset);
    if (marker === SOS || marker === EOI) break;
    const length = readUint16(bytes, offset + 2);
    if (length < 2) break;
    const end = offset + 2 + length;
    if (end > bytes.length) break;
    segments.push({
      marker,
      start: offset,
      end,
      payloadStart: offset + 4,
      payloadEnd: end,
    });
    offset = end;
  }
  return segments;
}

export async function insertApp1AfterSoi(jpeg: Blob, payload: Uint8Array): Promise<Blob> {
  if (payload.length > 0xffff - 2) {
    throw new Error('XMP payload is too large for JPEG APP1.');
  }
  const header = new Uint8Array(4);
  header[0] = 0xff;
  header[1] = 0xe1;
  const length = payload.length + 2;
  header[2] = (length >>> 8) & 0xff;
  header[3] = length & 0xff;
  return new Blob([jpeg.slice(0, 2), header, payload, jpeg.slice(2)], {
    type: jpeg.type || 'image/jpeg',
  });
}

export function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}
