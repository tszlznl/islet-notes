import { ImageLoadingSpinner } from '@/mobile/components/image/ImageLoadingSpinner';
import { useService } from '@/hooks/use-service';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  AttachmentUploadTaskRecord,
  LOCAL_FILE_MISSING_ERROR_CODE,
} from '@/services/fileAsset/common/uploadTaskStore';
import React, { useEffect, useState } from 'react';
import { getImageMessageStyle } from '../image/main';
import { UploadFailureIndicator } from './UploadFailureIndicator';

interface UploadImageMessageProps {
  task: AttachmentUploadTaskRecord;
  align?: 'left' | 'right';
}

export function UploadImageMessage({ task, align }: UploadImageMessageProps) {
  const fileAssetService = useService(IFileAssetService);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const imageStyle = getImageMessageStyle(task.width, task.height);
  const failed = task.status === 'failed';
  const canRetry = failed && task.errorCode !== LOCAL_FILE_MISSING_ERROR_CODE;
  const alignLeft = align === 'left';

  useEffect(() => {
    let disposed = false;
    // 视频任务的原始文件是 MP4，不能当作图片预览；用封面占位。
    if (task.type === 'video') {
      setPreviewUrl(task.previewThumbnail);
      return;
    }
    void fileAssetService.getFileUrl(task.s3Key, { role: 'thumbnail' }).then((next) => {
      if (!disposed) setPreviewUrl(next);
    });
    return () => {
      disposed = true;
    };
  }, [fileAssetService, task.id, task.previewThumbnail, task.s3Key, task.type]);

  // 失败图标与语音消息同规则:放在靠屏幕中间的一侧,左侧身份消息镜像到图片右边。
  const failureIndicator = failed ? (
    <UploadFailureIndicator
      mediaType={task.type === 'video' ? 'video' : 'image'}
      canRetry={canRetry}
      errorMessage={task.errorMessage}
      onRetry={() => fileAssetService.retryAttachmentTask(task.id)}
      onDelete={() => fileAssetService.deleteAttachmentTask(task.id)}
    />
  ) : null;

  return (
    <div
      className={alignLeft ? styles.UploadImageMessage.RootLeft : styles.UploadImageMessage.Root}
      data-test-id={DiaryChat.uploadMessage}
    >
      <div
        className={
          failed
            ? alignLeft
              ? styles.UploadImageMessage.FailedRowLeft
              : styles.UploadImageMessage.FailedRow
            : undefined
        }
      >
        {alignLeft ? null : failureIndicator}
        <div className={styles.UploadImageMessage.ImageBox} style={imageStyle}>
          {previewUrl ? (
            <img
              className={styles.AttachmentImage.Image}
              data-test-id={DiaryChat.uploadImage}
              src={previewUrl}
              alt=''
              style={imageStyle}
            />
          ) : (
            <div className={styles.AttachmentImage.Image} style={imageStyle} />
          )}
          {failed ? (
            <div className={styles.UploadImageMessage.FailedOverlay} aria-hidden='true' />
          ) : (
            <div
              className={styles.UploadImageMessage.UploadingOverlay}
              data-test-id={DiaryChat.uploadLoading}
              aria-label={localize('common.uploading', 'Uploading...')}
            >
              <ImageLoadingSpinner tone='light' />
            </div>
          )}
        </div>
        {alignLeft ? failureIndicator : null}
      </div>
    </div>
  );
}
