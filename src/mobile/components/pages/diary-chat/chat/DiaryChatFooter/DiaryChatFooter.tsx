import {
  getActiveIdentities,
  getIdentityAvatarAttachment,
  getIdentityById,
} from '@/core/diary/selectors';
import { DiaryChat } from '@/mobile/test.id';
import { styles, zIndex } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { usePreference } from '@/mobile/hooks/usePreference';
import { useDateTimePicker } from '@/mobile/overlay/dateTimePicker/useDateTimePicker';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useIdentityPicker } from '@/mobile/overlay/identityPicker/useIdentityPicker';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { IdentityConfigPreference } from '@/services/diary/common/identityConfig';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { ITrackService } from '@/services/track/common/trackService';
import {
  isVoiceRecordingSupported,
  type VoiceRecordingResult,
} from '@/mobile/overlay/voiceRecording/voiceRecorderEngine';
import React, { forwardRef, useMemo, useRef, useState } from 'react';
import { useReplyDraft } from '@/mobile/components/pages/diary-chat/chat/replyDraftContext';
import { AttachmentActionPanel } from './AttachmentActionPanel';
import { ChatInputRow } from './ChatInputRow';
import { IdentityTag } from './IdentityTag';
import { ReplyQuoteTag } from './ReplyQuoteTag';
import { TimeMachineTag } from './TimeMachineTag';
import { useAutoResizeTextarea } from './useAutoResizeTextarea';
import { useDiaryChatMediaActions } from './useDiaryChatMediaActions';

interface DiaryChatFooterProps {
  notebookId: string;
}

export const DiaryChatFooter = forwardRef<HTMLElement, DiaryChatFooterProps>(
  function DiaryChatFooter({ notebookId }, ref) {
    const diaryService = useService(IDiaryService);
    const fileAssetService = useService(IFileAssetService);
    const navigationService = useService(INavigationService);
    const trackService = useService(ITrackService);
    const showToast = useSuccessToast();
    const showDialog = useDialog();
    const showDateTimePicker = useDateTimePicker();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const model = useDiaryModel();
    const showIdentityPicker = useIdentityPicker();
    const {
      status: membershipStatus,
      data: resolvedMembershipStatus,
      isLoading: membershipLoading,
    } = useMembershipStatus();
    const membershipStatusPending = membershipLoading || !resolvedMembershipStatus;
    const [text, setText] = useState('');
    const [voiceMode, setVoiceMode] = useState(false);
    const [plusOpen, setPlusOpen] = useState(false);
    // 仅当次会话生效：只存 id，身份被归档或删除时自动视为未选择。
    const [identityId, setIdentityId] = useState<string>();
    // 时光机选中的时间，仅当次会话生效；后续发送的消息 displayAt 都用它。
    const [timeMachineAt, setTimeMachineAt] = useState<number>();
    const identityCandidate = identityId ? getIdentityById(model, identityId) : undefined;
    const selectedIdentity =
      identityCandidate && !identityCandidate.archivedAt ? identityCandidate : undefined;
    const activeIdentities = getActiveIdentities(model);
    // 身份开关（身份管理页顶部）关闭时，输入区不显示身份按钮。
    const [identityConfig] = usePreference(IdentityConfigPreference);
    const identityEntryEnabled = identityConfig.chatEntryEnabled;
    const replyDraft = useReplyDraft();
    const replyToEntryId = replyDraft?.replyToEntryId;
    const voiceSupported = useMemo(() => isVoiceRecordingSupported(), []);
    const { videoSupported, takePhoto, pickFromAlbum, startRecordVideo } = useDiaryChatMediaActions(
      {
        notebookId,
        identityId: selectedIdentity?.id,
        displayAt: timeMachineAt,
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
        displayAt: timeMachineAt,
        replyToEntryId,
      });
      replyDraft?.setReplyToEntryId(undefined);
      // 未来消息不会出现在聊天列表，用 toast 告知用户已保存，避免误以为发送失败。
      if (timeMachineAt !== undefined && timeMachineAt > Date.now()) {
        showToast({
          message: localize('diary.timeMachine.futureSaved', 'Saved to future messages'),
        });
      }
      setText('');
      setPlusOpen(false);
    };

    // 时光机：会员专属。选定时间后，后续消息按该时间展示与排序。
    const openTimeMachine = () => {
      if (membershipStatusPending) return;
      setPlusOpen(false);
      if (!membershipStatus.active) {
        showDialog({
          title: localize('diary.timeMachine', 'Time machine'),
          message: localize(
            'diary.timeMachine.memberOnly',
            'Time machine is a membership feature. Get membership to send entries to the past or future.',
          ),
          confirmLabel: localize('diary.timeMachine.goPurchase', 'Get membership'),
          cancelLabel: localize('common.cancel', 'Cancel'),
          rootTestId: DiaryChat.timeMachineVipDialog,
          confirmTestId: DiaryChat.timeMachineVipConfirm,
          cancelTestId: DiaryChat.timeMachineVipCancel,
          onConfirm: () => navigationService.navigate({ path: '/settings/membership' }),
        });
        return;
      }
      showDateTimePicker({
        title: localize('diary.timeMachine.pickerTitle', 'Choose a time'),
        value: new Date(timeMachineAt ?? Date.now()),
        rootTestId: DiaryChat.timeMachinePicker,
        confirmTestId: DiaryChat.timeMachinePickerConfirm,
        cancelTestId: DiaryChat.timeMachinePickerCancel,
        onConfirm: (date) => setTimeMachineAt(date.getTime()),
      });
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
          displayAt: timeMachineAt,
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
        {timeMachineAt !== undefined && (
          <TimeMachineTag timestamp={timeMachineAt} onRemove={() => setTimeMachineAt(undefined)} />
        )}
        {replyToEntryId && (
          <ReplyQuoteTag
            model={model}
            replyToEntryId={replyToEntryId}
            onRemove={() => replyDraft?.setReplyToEntryId(undefined)}
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
              timeMachineVisible
              timeMachineDisabled={membershipStatusPending}
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
              onOpenTimeMachine={() => {
                trackService.trackEvent('diary_chat_time_machine_click');
                openTimeMachine();
              }}
            />
          )}
        </div>
      </footer>
    );
  },
);
