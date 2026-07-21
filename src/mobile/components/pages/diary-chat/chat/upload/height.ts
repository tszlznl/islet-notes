import type { AttachmentUploadTaskRecord } from '@/services/fileAsset/common/uploadTaskStore';
import { AUDIO_TRANSCRIBING_HEIGHT, estimateAudioTranscriptHeight } from '../audio/height';
import { estimateImageMessageHeight } from '../image/main';

export function estimateUploadMessageHeight(
  task: AttachmentUploadTaskRecord,
  viewportWidth: number,
  transcribing?: boolean,
) {
  if (task.type === 'audio') {
    const belowExtra = transcribing
      ? AUDIO_TRANSCRIBING_HEIGHT
      : estimateAudioTranscriptHeight(task.transcript, viewportWidth);
    return 50 + belowExtra;
  }
  return estimateImageMessageHeight(task.width, task.height, viewportWidth);
}
