import type { ImageAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  IFileAssetService,
  imageUploadResultToAttachment,
} from '@/services/fileAsset/common/fileAssetService';
import { ImagePickSource, IHostService } from '@/services/native/common/hostService';
import { useCallback, useRef, useState } from 'react';

interface PickNotebookImageFromAlbumOptions {
  notebookId: string | undefined;
  onSuccess: (attachment: ImageAttachmentRecord, notebookId: string) => void | Promise<void>;
}

export function usePickNotebookImageFromAlbum({
  notebookId,
  onSuccess,
}: PickNotebookImageFromAlbumOptions) {
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const showLoadingToast = useLoadingToast();
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);

  const pick = useCallback(async () => {
    if (!notebookId || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    let loadingToast: { dispose(): void } | undefined;
    try {
      const file = await hostService.pickImageBlob(ImagePickSource.Photos);
      if (!file) return;
      loadingToast = showLoadingToast({ message: localize('common.uploading', 'Uploading...') });
      const result = await fileAssetService.uploadImage(file, { thumbnail: true });
      const attachment = imageUploadResultToAttachment(result, notebookId);
      diaryService.addAttachment(attachment);
      await onSuccess(attachment, notebookId);
    } catch {
      // 上传失败静默忽略，用户可重试。
    } finally {
      loadingToast?.dispose();
      uploadingRef.current = false;
      setUploading(false);
    }
  }, [diaryService, fileAssetService, hostService, notebookId, onSuccess, showLoadingToast]);

  return { uploading, pick };
}
