import { readBytes, readJpegSegments } from './jpeg';

const APP1 = 0xffe1;
const XMP_HEADER = 'http://ns.adobe.com/xap/1.0/\0';
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export async function readXmpPackets(jpeg: Blob): Promise<string[]> {
  const segments = await readJpegSegments(jpeg);
  const packets: string[] = [];
  for (const segment of segments) {
    if (segment.marker !== APP1) continue;
    const payload = await readBytes(jpeg, segment.payloadStart, segment.payloadEnd);
    const header = textDecoder.decode(payload.slice(0, XMP_HEADER.length));
    if (header !== XMP_HEADER) continue;
    packets.push(textDecoder.decode(payload.slice(XMP_HEADER.length)));
  }
  return packets;
}

export function hasMotionPhotoMarker(xmp: string): boolean {
  return (
    /\b(?:GCamera|Camera):MotionPhoto\s*=\s*["']1["']/.test(xmp) ||
    /\b(?:GCamera|Camera):MicroVideo\s*=\s*["']1["']/.test(xmp) ||
    hasContainerMotionVideoItem(xmp)
  );
}

export function readMicroVideoOffset(xmp: string): number | undefined {
  const match = xmp.match(/\b(?:GCamera|Camera):MicroVideoOffset\s*=\s*["'](\d+)["']/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export interface ContainerMotionVideoSegment {
  offsetFromEnd: number;
  length: number;
}

interface ContainerItem {
  length?: number;
  padding: number;
  mime?: string;
  semantic?: string;
}

export function readContainerMotionVideoSegment(
  xmp: string,
): ContainerMotionVideoSegment | undefined {
  if (!/Container:Directory/.test(xmp)) return undefined;

  const items = readContainerItems(xmp);
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (!item.length || !isMotionVideoItem(item)) continue;

    const offsetFromEnd = items
      .slice(index)
      .reduce((total, current) => total + (current.length ?? 0) + current.padding, 0);
    if (!Number.isSafeInteger(offsetFromEnd) || offsetFromEnd <= 0) continue;
    return { offsetFromEnd, length: item.length };
  }
  return undefined;
}

function readContainerItems(xmp: string): ContainerItem[] {
  const itemTags = xmp.match(/<[^<>\s]+:Item\b[^<>]*>/g) ?? [];
  return itemTags
    .map((tag) => {
      const attrs = readXmlAttributes(tag);
      const length = readPositiveIntegerAttr(attrs, 'Length');
      const padding = readNonNegativeIntegerAttr(attrs, 'Padding') ?? 0;
      return {
        length,
        padding,
        mime: readAttr(attrs, 'Mime')?.toLowerCase(),
        semantic: readAttr(attrs, 'Semantic')?.toLowerCase(),
      };
    })
    .filter((item) => item.length !== undefined || item.mime || item.semantic);
}

function hasContainerMotionVideoItem(xmp: string): boolean {
  if (!/Container:Directory/.test(xmp)) return false;
  return readContainerItems(xmp).some(isMotionVideoItem);
}

function isMotionVideoItem(item: ContainerItem): boolean {
  return item.mime === 'video/mp4' || item.semantic === 'motionphoto';
}

function readXmlAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)) {
    attrs.set(match[1].split(':').at(-1) ?? match[1], match[3]);
  }
  return attrs;
}

function readAttr(attrs: Map<string, string>, name: string): string | undefined {
  return attrs.get(name);
}

function readPositiveIntegerAttr(attrs: Map<string, string>, name: string): number | undefined {
  const value = readNonNegativeIntegerAttr(attrs, name);
  return value && value > 0 ? value : undefined;
}

function readNonNegativeIntegerAttr(attrs: Map<string, string>, name: string): number | undefined {
  const raw = readAttr(attrs, name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export function buildMicroVideoXmp(videoLength: number): Uint8Array {
  const xmp = [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description',
    ' xmlns:GCamera="http://ns.google.com/photos/1.0/camera/"',
    ' GCamera:MotionPhoto="1"',
    ' GCamera:MicroVideo="1"',
    ` GCamera:MicroVideoOffset="${videoLength}"`,
    '/>',
    '</rdf:RDF>',
    '</x:xmpmeta>',
  ].join('');
  return textEncoder.encode(`${XMP_HEADER}${xmp}`);
}
