import { registerPlugin } from '@capacitor/core';

export interface NativeMediaPickerPickOptions {
  mediaTypes: 'images' | 'images-and-videos';
  cacheScope?: string;
  /** 最多可选数量，大于 1 时 Android 相册开启多选；缺省单选。 */
  limit?: number;
}

export type NativeMediaPickerPickItem =
  | {
      kind: 'image';
      photoPath: string;
      mimeType?: string;
      livePhoto?: {
        stillPath: string;
        stillMimeType?: string;
        videoPath: string;
        videoMimeType?: string;
      };
    }
  | {
      kind: 'video';
      uri: string;
    };

/** Android 返回 items 数组；iOS 仍返回单个对象，读取时统一走 normalize。 */
export type NativeMediaPickerPickResponse =
  | NativeMediaPickerPickItem
  | { items: NativeMediaPickerPickItem[] };

export function normalizeNativeMediaPickerResponse(
  response: NativeMediaPickerPickResponse,
): NativeMediaPickerPickItem[] {
  if ('items' in response && Array.isArray(response.items)) {
    return response.items;
  }
  return [response as NativeMediaPickerPickItem];
}

interface NativeMediaPickerPlugin {
  pick(options: NativeMediaPickerPickOptions): Promise<NativeMediaPickerPickResponse>;
}

export const NativeMediaPicker = registerPlugin<NativeMediaPickerPlugin>('MediaPicker');
