import {
  getActiveIdentities,
  getIdentityAvatarAttachment,
  getIdentityById,
} from '@/core/diary/selectors';
import { DiaryChat } from '@/mobile/test.id';
import { styles, zIndex } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useIdentityPicker } from '@/mobile/overlay/identityPicker/useIdentityPicker';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  IDENTITY_CONFIG_KEY,
  IDENTITY_CONFIG_SWR_KEY,
  IdentityConfigSchema,
} from '@/services/diary/common/identityConfig';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import { ITrackService } from '@/services/track/common/trackService';
import {
  isVoiceRecordingSupported,
  type VoiceRecordingResult,
} from '@/mobile/overlay/voiceRecording/voiceRecorderEngine';
import React, { forwardRef, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { AttachmentActionPanel } from './AttachmentActionPanel';
import { ChatInputRow } from './ChatInputRow';
import { IdentityTag } from './IdentityTag';
import { useAutoResizeTextarea } from './useAutoResizeTextarea';
import { useDiaryChatMediaActions } from './useDiaryChatMediaActions';

interface DiaryChatFooterProps {
  notebookId: string;
}

export const DiaryChatFooter = forwardRef<HTMLElement, DiaryChatFooterProps>(
  function DiaryChatFooter({ notebookId }, ref) {
    const diaryService = useService(IDiaryService);
    const fileAssetService = useService(IFileAssetService);
    const hostService = useService(IHostService);
    const trackService = useService(ITrackService);
    const showToast = useSuccessToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const model = useDiaryModel();
    const showIdentityPicker = useIdentityPicker();
    const [text, setText] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const [plusOpen, setPlusOpen] = useState(false);
    // 仅当次会话生效：只存 id，身份被归档或删除时自动视为未选择。
    const [identityId, setIdentityId] = useState<string>();
    const identityCandidate = identityId ? getIdentityById(model, identityId) : undefined;
    const selectedIdentity =
      identityCandidate && !identityCandidate.archivedAt ? identityCandidate : undefined;
    const activeIdentities = getActiveIdentities(model);
    // 身份开关（身份管理页顶部）关闭时，输入区不显示身份按钮。
    const { data: identityConfig } = useSWR(IDENTITY_CONFIG_SWR_KEY, async () =>
      hostService.getPreference(IDENTITY_CONFIG_KEY, IdentityConfigSchema),
    );
    const identityEntryEnabled = identityConfig?.chatEntryEnabled ?? true;
    const voiceSupported = useMemo(() => isVoiceRecordingSupported(), []);
    const { videoSupported, takePhoto, pickFromAlbum, startRecordVideo } = useDiaryChatMediaActions(
      {
        notebookId,
        identityId: selectedIdentity?.id,
        closePlusPanel: () => setPlusOpen(false),
        showError: (message) => showToast({ message, icon: 'none' }),
      },
    );
    useAutoResizeTextarea(textareaRef, text);

    const sendText = () => {
      const content = text.trim();
      if (!content || voiceMode) return;
      diaryService.addTextEntryWithOptions({
        notebookId,
        text: content,
        identityId: selectedIdentity?.id,
      });
      setText('');
      setPlusOpen(false);
    };

    const openIdentityPicker = () => {
      setPlusOpen(false);
      showIdentityPicker({
        title: localize('identity.pickerTitle', 'Choose identity'),
        identities: activeIdentities.map((identity) => {
          const candidate = getIdentityAvatarAttachment(model, identity);
          return {
            id: identity.id,
            name: identity.name,
            avatarAttachment: candidate?.type === 'image' ? candidate : undefined,
          };
        }),
        rootTestId: DiaryChat.identityPickerSheet,
        listTestId: DiaryChat.identityPickerList,
        optionTestId: DiaryChat.identityPickerOption,
        closeTestId: DiaryChat.identityPickerCancel,
        onSelect: (selected) => setIdentityId(selected),
      });
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
          identityId: selectedIdentity?.id,
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
        {selectedIdentity && (
          <IdentityTag
            model={model}
            identity={selectedIdentity}
            onRemove={() => setIdentityId(undefined)}
          />
        )}
        <div className={styles.DiaryChatFooter.InputArea}>
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
            onOpenIdentityPicker={
              identityEntryEnabled && activeIdentities.length > 0 ? openIdentityPicker : undefined
            }
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
        </div>
      </footer>
    );
  },
);
