import { DiaryChat } from '@/mobile/test.id';
import { styles, zIndex } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { ITrackService } from '@/services/track/common/trackService';
import {
  isVoiceRecordingSupported,
  type VoiceRecordingResult,
} from '@/mobile/overlay/voiceRecording/voiceRecorderEngine';
import React, { forwardRef, useMemo, useRef, useState } from 'react';
import { AttachmentActionPanel } from './AttachmentActionPanel';
import { ChatInputRow } from './ChatInputRow';
import { useAutoResizeTextarea } from './useAutoResizeTextarea';
import { useDiaryChatMediaActions } from './useDiaryChatMediaActions';

interface DiaryChatFooterProps {
  notebookId: string;
}

export const DiaryChatFooter = forwardRef<HTMLElement, DiaryChatFooterProps>(
  function DiaryChatFooter({ notebookId }, ref) {
    const diaryService = useService(IDiaryService);
    const fileAssetService = useService(IFileAssetService);
    const trackService = useService(ITrackService);
    const showToast = useSuccessToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const [plusOpen, setPlusOpen] = useState(false);
    const voiceSupported = useMemo(() => isVoiceRecordingSupported(), []);
    const { videoSupported, takePhoto, pickFromAlbum, startRecordVideo } = useDiaryChatMediaActions(
      {
        notebookId,
        closePlusPanel: () => setPlusOpen(false),
        showError: (message) => showToast({ message, icon: 'none' }),
      },
    );
    useAutoResizeTextarea(textareaRef, text);

    const sendText = () => {
      const content = text.trim();
      if (!content || voiceMode) return;
      diaryService.addTextEntry(notebookId, content);
      setText('');
      setPlusOpen(false);
    };

    const showVoiceError = (message: string) => {
      showToast({ message, icon: 'none' });
    };

    // 切到语音模式不请求麦克风权限,等按下录音时再请求。
    const toggleVoiceMode = () => {
      if (voiceMode) {
        setVoiceMode(false);
        return;
      }
      setPlusOpen(false);
      textareaRef.current?.blur();
      setVoiceMode(true);
    };

    const sendVoice = async (result: VoiceRecordingResult) => {
      // 只负责上传;识别在上传落库后由 committer 触发。
      try {
        await fileAssetService.uploadAudioAttachment({
          notebookId,
          file: result.blob,
          duration: Math.round(result.duration * 10) / 10,
        });
      } catch (event) {
        showVoiceError(event instanceof Error ? event.message : String(event));
      }
    };

    return (
      <footer
        ref={ref}
        className={styles.DiaryChatFooter.Root}
        data-test-id={DiaryChat.inputWrap}
        style={{ zIndex: zIndex.chatFooter }}
      >
        <ChatInputRow
          textareaRef={textareaRef}
          text={text}
          voiceMode={voiceMode}
          voiceSupported={voiceSupported}
          plusOpen={plusOpen}
          onTextChange={setText}
          onClosePlusPanel={() => setPlusOpen(false)}
          onTogglePlusPanel={() => setPlusOpen(!plusOpen)}
          onToggleVoiceMode={toggleVoiceMode}
          onSendText={sendText}
          onSendVoice={sendVoice}
          onVoiceError={showVoiceError}
        />
        {plusOpen && (
          <AttachmentActionPanel
            videoSupported={videoSupported}
            onPickFromAlbum={() => {
              trackService.trackEvent('diary_chat_album_click');
              void pickFromAlbum();
            }}
            onTakePhoto={() => {
              trackService.trackEvent('diary_chat_camera_click');
              void takePhoto();
            }}
            onStartRecordVideo={() => {
              trackService.trackEvent('diary_chat_video_click');
              void startRecordVideo();
            }}
          />
        )}
      </footer>
    );
  },
);
