import { bytesToArrayBuffer } from './arrayBuffer';
import { base64ToBytes, bytesToBase64 } from './base64';

export async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  return new Blob([bytesToArrayBuffer(base64ToBytes(base64))], { type: mimeType });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return `data:${blob.type};base64,${await blobToBase64(blob)}`;
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
