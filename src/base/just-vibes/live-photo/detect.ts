import type { LivePhotoContainer } from './types';
import { hasMotionPhotoMarker, readXmpPackets } from './xmp';

export async function detectLivePhoto(blob: Blob): Promise<LivePhotoContainer | undefined> {
  if (!isJpeg(blob)) return undefined;
  const packets = await readXmpPackets(blob);
  return packets.some(hasMotionPhotoMarker) ? 'motion-jpeg' : undefined;
}

function isJpeg(blob: Blob): boolean {
  const type = blob.type.split(';', 1)[0].toLowerCase();
  return !type || type === 'image/jpeg' || type === 'image/jpg';
}
