import type { AudioAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { styles } from '@/mobile/styles/ui';
import { ISpeechRecognitionService } from '@/services/speechRecognition/common/speechRecognitionService';
import React from 'react';
import { AttachmentAudio } from './AttachmentAudio';
import { AudioTranscribingBar } from './AudioTranscribingBar';
import { AudioTranscript } from './AudioTranscript';

export interface AudioMessageProps {
  entryId: string;
  attachment: AudioAttachmentRecord;
  transcript?: string;
  align?: 'left' | 'right';
}

export function AudioMessage({ entryId, attachment, transcript, align }: AudioMessageProps) {
  const speechRecognitionService = useService(ISpeechRecognitionService);
  useWatchEvent(speechRecognitionService.onDidChangeTranscribing);
  const transcribing = speechRecognitionService.isTranscribing(entryId);
  const text = transcript?.trim();
  return (
    <div
      className={
        align === 'left'
          ? styles.ChatAudio.AudioMessageStackLeft
          : styles.ChatAudio.AudioMessageStack
      }
    >
      <AttachmentAudio
        entryId={entryId}
        attachment={attachment}
        hasTranscript={!!text}
        align={align}
      />
      {transcribing ? (
        <AudioTranscribingBar entryId={entryId} />
      ) : text ? (
        <AudioTranscript entryId={entryId} text={text} />
      ) : null}
    </div>
  );
}
