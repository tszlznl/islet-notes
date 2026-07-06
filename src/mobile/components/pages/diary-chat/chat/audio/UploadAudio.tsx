import { formatAudioDuration } from '@/base/just-vibes/media-metrics';
import { useService } from '@/hooks/use-service';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  AttachmentUploadTaskRecord,
  LOCAL_FILE_MISSING_ERROR_CODE,
} from '@/services/fileAsset/common/uploadTaskStore';
import React from 'react';
import { UploadFailureIndicator } from '../upload/UploadFailureIndicator';
import { AudioWaveIcon } from './AudioWaveIcon';
import { UploadAudioTranscript } from './UploadAudioTranscript';
import { getAudioBubbleWidth } from './layout';

interface UploadAudioMessageProps {
  task: AttachmentUploadTaskRecord;
  align?: 'left' | 'right';
}

export function UploadAudioMessage({ task, align }: UploadAudioMessageProps) {
  const fileAssetService = useService(IFileAssetService);
  const duration = task.duration ?? 0;
  const canRetry = task.status === 'failed' && task.errorCode !== LOCAL_FILE_MISSING_ERROR_CODE;
  const transcript = task.transcript?.trim();
  const alignLeft = align === 'left';
  const audioBubbleClass =
    task.status === 'failed'
      ? alignLeft
        ? styles.ChatAudio.AudioMessageLeft
        : styles.ChatAudio.AudioMessage
      : alignLeft
        ? styles.ChatAudio.UploadAudioBubbleLeft
        : styles.ChatAudio.UploadAudioBubble;
  // 与微信一致:右侧气泡时长在前、波纹贴右缘;左侧气泡镜像为波纹贴左缘、时长在后。
  const durationLabel = (
    <span className={styles.ChatAudio.AudioDuration}>{formatAudioDuration(duration)}</span>
  );
  const waveIcon = <AudioWaveIcon playing={false} align={align} />;
  const audioBubble = (
    <div className={audioBubbleClass} style={{ width: `${getAudioBubbleWidth(duration)}px` }}>
      {alignLeft ? waveIcon : durationLabel}
      {alignLeft ? durationLabel : waveIcon}
    </div>
  );

  if (task.status === 'failed') {
    return (
      <div
        className={
          alignLeft
            ? styles.ChatAudio.UploadAudioFailedRootLeft
            : styles.ChatAudio.UploadAudioFailedRoot
        }
        data-test-id={DiaryChat.uploadMessage}
      >
        <div
          className={
            alignLeft ? styles.ChatAudio.UploadFailedRowLeft : styles.ChatAudio.UploadFailedRow
          }
        >
          {alignLeft ? audioBubble : null}
          <UploadFailureIndicator
            mediaType='audio'
            canRetry={canRetry}
            errorMessage={task.errorMessage}
            onRetry={() => fileAssetService.retryAttachmentTask(task.id)}
            onDelete={() => fileAssetService.deleteAttachmentTask(task.id)}
          />
          {alignLeft ? null : audioBubble}
        </div>
        {transcript && <UploadAudioTranscript text={transcript} />}
      </div>
    );
  }

  return (
    <div
      className={
        alignLeft ? styles.ChatAudio.AudioMessageStackLeft : styles.ChatAudio.AudioMessageStack
      }
      data-test-id={DiaryChat.uploadMessage}
    >
      <div
        className={
          alignLeft ? styles.ChatAudio.UploadAudioRowLeft : styles.ChatAudio.UploadAudioRow
        }
      >
        {alignLeft ? audioBubble : null}
        <span
          className={styles.ChatAudio.UploadSendingSpinner}
          data-test-id={DiaryChat.uploadAudioSending}
          aria-label={localize('common.uploading', 'Uploading...')}
        />
        {alignLeft ? null : audioBubble}
      </div>
      {transcript ? <UploadAudioTranscript text={transcript} /> : null}
    </div>
  );
}
