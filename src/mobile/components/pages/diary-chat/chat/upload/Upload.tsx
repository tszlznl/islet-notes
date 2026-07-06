import { AttachmentUploadTaskRecord } from '@/services/fileAsset/common/uploadTaskStore';
import React from 'react';
import { UploadAudioMessage } from '../audio/UploadAudio';
import { UploadImageMessage } from './UploadImageMessage';

interface UploadMessageProps {
  task: AttachmentUploadTaskRecord;
  align?: 'left' | 'right';
}

export function UploadMessage({ task, align }: UploadMessageProps) {
  if (task.type === 'audio') return <UploadAudioMessage task={task} align={align} />;
  return <UploadImageMessage task={task} align={align} />;
}
