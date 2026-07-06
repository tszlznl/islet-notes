export const BROWSER_IMAGE_LOAD_TIMEOUT_MS = 15_000;

export function waitForImageLoad(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      callback();
    };

    timeoutId = setTimeout(() => {
      settle(() => reject(new Error('Image load timed out.')));
    }, BROWSER_IMAGE_LOAD_TIMEOUT_MS);
    image.onload = () => settle(resolve);
    image.onerror = () => settle(() => reject(new Error('Failed to load image.')));
    image.src = url;
    if (image.complete && image.naturalWidth > 0) {
      settle(resolve);
      return;
    }
    void image.decode?.().then(
      () => settle(resolve),
      () => settle(() => reject(new Error('Failed to decode image.'))),
    );
  });
}

export function withImageLoadTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Image URL load timed out.')),
      BROWSER_IMAGE_LOAD_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
