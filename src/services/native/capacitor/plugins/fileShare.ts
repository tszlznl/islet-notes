import { registerPlugin } from '@capacitor/core';

export interface NativeFileShareOptions {
  filename: string;
  mimeType?: string;
  /** 原生文件路径，适合分享已落盘的图片、视频等大文件。与 data 二选一。 */
  path?: string;
  /** base64 编码的文件内容，适合分享内存中生成的小文件。与 path 二选一。 */
  data?: string;
}

interface NativeFileSharePlugin {
  shareFile(options: NativeFileShareOptions): Promise<void>;
}

export const NativeFileShare = registerPlugin<NativeFileSharePlugin>('FileShare');
