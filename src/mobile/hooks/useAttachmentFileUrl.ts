import { useService } from '@/hooks/use-service';
import { loadImageUrl } from '@/mobile/utils/imageLoad';
import {
  type FileUrlOptions,
  IFileAssetService,
} from '@/services/fileAsset/common/fileAssetService';
import { useEffect, useState } from 'react';

export function useAttachmentFileUrl(key: string | undefined, options: FileUrlOptions) {
  const fileAssetService = useService(IFileAssetService);
  const [url, setUrl] = useState<string>();
  const role = options.role;

  useEffect(() => {
    let disposed = false;
    setUrl(undefined);
    if (!key) return;
    loadImageUrl(fileAssetService, key, { role })
      .then((next) => {
        if (!disposed) setUrl(next);
      })
      .catch(() => {
        if (!disposed) setUrl(undefined);
      });
    return () => {
      disposed = true;
    };
  }, [fileAssetService, key, role]);

  return url;
}
