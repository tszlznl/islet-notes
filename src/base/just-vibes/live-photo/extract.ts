import { detectLivePhoto } from './detect';
import { findMp4StartFromTail, startsWithFtyp } from './mp4';
import { readBytes } from './jpeg';
import { readContainerMotionVideoSegment, readMicroVideoOffset, readXmpPackets } from './xmp';

interface VideoRange {
  start: number;
  end?: number;
}

export async function extractLivePhotoVideo(blob: Blob): Promise<Blob | undefined> {
  if ((await detectLivePhoto(blob)) !== 'motion-jpeg') return undefined;
  for (const range of await findVideoRangesFromXmp(blob)) {
    const video = await sliceMp4Range(blob, range);
    if (video) return video;
  }

  const start = await findMp4StartFromTail(blob);
  return start === undefined ? undefined : sliceMp4Range(blob, { start });
}

async function findVideoRangesFromXmp(blob: Blob): Promise<VideoRange[]> {
  const ranges: VideoRange[] = [];
  for (const xmp of await readXmpPackets(blob)) {
    const segment = readContainerMotionVideoSegment(xmp);
    if (segment && segment.offsetFromEnd < blob.size) {
      const start = blob.size - segment.offsetFromEnd;
      const end = start + segment.length;
      if (end <= blob.size) ranges.push({ start, end });
    }

    const offset = readMicroVideoOffset(xmp);
    if (offset && offset < blob.size) ranges.push({ start: blob.size - offset });
  }
  return ranges;
}

async function sliceMp4Range(blob: Blob, range: VideoRange): Promise<Blob | undefined> {
  if (range.start < 0 || range.start >= blob.size) return undefined;
  if (range.end !== undefined && (range.end <= range.start || range.end > blob.size)) {
    return undefined;
  }
  const header = await readBytes(blob, range.start, Math.min(blob.size, range.start + 16));
  if (!startsWithFtyp(header)) return undefined;
  return new Blob([blob.slice(range.start, range.end)], { type: 'video/mp4' });
}
