export interface BrowserBlobFileDownloadOptions {
  filename: string;
  blob: Blob;
}

export function downloadBrowserBlobFile(options: BrowserBlobFileDownloadOptions): void {
  const url = URL.createObjectURL(options.blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
