import { insertApp1AfterSoi } from './jpeg';
import { buildMicroVideoXmp } from './xmp';

export async function buildMotionPhotoJpeg(jpeg: Blob, video: Blob): Promise<Blob> {
  const withXmp = await insertApp1AfterSoi(jpeg, buildMicroVideoXmp(video.size));
  return new Blob([withXmp, video], { type: 'image/jpeg' });
}
