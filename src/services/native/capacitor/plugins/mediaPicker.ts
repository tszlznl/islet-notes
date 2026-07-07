import { registerPlugin } from '@capacitor/core';

export interface NativeMediaPickerPickOptions {
  mediaTypes: 'images' | 'images-and-videos';
  cacheScope?: string;
}

export type NativeMediaPickerPickResult =
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

interface NativeMediaPickerPlugin {
  pick(options: NativeMediaPickerPickOptions): Promise<NativeMediaPickerPickResult>;
}

export const NativeMediaPicker = registerPlugin<NativeMediaPickerPlugin>('MediaPicker');
