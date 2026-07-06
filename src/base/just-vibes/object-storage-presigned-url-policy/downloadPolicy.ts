export const PRESIGNED_GET_EXPIRES_IN = 7 * 24 * 60 * 60;
export const PRESIGNED_GET_SIGNING_WINDOW_MS = 6 * 24 * 60 * 60 * 1000;
export const IMMUTABLE_ATTACHMENT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export function getPresignedGetSigningDate(now = Date.now()): Date {
  return new Date(
    Math.floor(now / PRESIGNED_GET_SIGNING_WINDOW_MS) * PRESIGNED_GET_SIGNING_WINDOW_MS,
  );
}
