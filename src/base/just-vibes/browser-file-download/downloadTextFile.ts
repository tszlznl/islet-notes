import { downloadBrowserBlobFile } from './downloadBlobFile';

export interface BrowserTextFileDownloadOptions {
  filename: string;
  text: string;
  mimeType?: string;
}

export function downloadBrowserTextFile(options: BrowserTextFileDownloadOptions): void {
  downloadBrowserBlobFile({
    filename: options.filename,
    blob: new Blob([options.text], { type: options.mimeType || 'text/plain;charset=utf-8' }),
  });
}
