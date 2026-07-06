import { localize } from '@/nls';
import { DiaryChat } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { HoldToTalkButton } from '@/mobile/overlay/voiceRecording/HoldToTalkButton';
import type { VoiceRecordingResult } from '@/mobile/overlay/voiceRecording/voiceRecorderEngine';
import { CirclePlus, CircleUserRound, Keyboard, Mic } from 'lucide-react';
import React, { type RefObject } from 'react';

interface ChatInputRowProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  text: string;
  voiceMode: boolean;
  voiceSupported: boolean;
  plusOpen: boolean;
  onTextChange: (value: string) => void;
  onClosePlusPanel: () => void;
  onTogglePlusPanel: () => void;
  onToggleVoiceMode: () => void;
  onSendText: () => void;
  onSendVoice: (result: VoiceRecordingResult) => void | Promise<void>;
  onVoiceError: (message: string) => void;
  /** 没有可选身份时不传，身份按钮隐藏。 */
  onOpenIdentityPicker?: () => void;
}

export function ChatInputRow({
  textareaRef,
  text,
  voiceMode,
  voiceSupported,
  plusOpen,
  onTextChange,
  onClosePlusPanel,
  onTogglePlusPanel,
  onToggleVoiceMode,
  onSendText,
  onSendVoice,
  onVoiceError,
  onOpenIdentityPicker,
}: ChatInputRowProps) {
  const hasText = text.trim().length > 0 && !voiceMode;

  return (
    <div className={styles.DiaryChatFooter.InputRow}>
      {voiceSupported && (
        <button
          className={styles.DiaryChatFooter.PlusButton}
          type='button'
          data-test-id={DiaryChat.voiceToggle}
          title={
            voiceMode
              ? localize('diary.voice.switchToKeyboard', 'Switch to keyboard')
              : localize('diary.voice.switchToVoice', 'Switch to voice input')
          }
          aria-label={
            voiceMode
              ? localize('diary.voice.switchToKeyboard', 'Switch to keyboard')
              : localize('diary.voice.switchToVoice', 'Switch to voice input')
          }
          onClick={onToggleVoiceMode}
        >
          {voiceMode ? (
            <Keyboard size={26} strokeWidth={1.6} />
          ) : (
            <Mic size={26} strokeWidth={1.6} />
          )}
        </button>
      )}
      {voiceMode ? (
        <HoldToTalkButton onSend={(result) => void onSendVoice(result)} onError={onVoiceError} />
      ) : (
        <div className={styles.DiaryChatFooter.TextareaWrap}>
          <textarea
            ref={textareaRef}
            className={styles.DiaryChatFooter.Textarea}
            data-test-id={DiaryChat.input}
            value={text}
            rows={1}
            placeholder={localize('diary.inputPlaceholder', 'Write something...')}
            onFocus={onClosePlusPanel}
            onChange={(event) => {
              onTextChange(event.target.value);
              if (event.target.value.trim()) {
                onClosePlusPanel();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSendText();
              }
            }}
          />
        </div>
      )}
      {onOpenIdentityPicker && (
        <button
          className={styles.DiaryChatFooter.PlusButton}
          type='button'
          data-test-id={DiaryChat.identityButton}
          title={localize('identity.pickerTitle', 'Choose identity')}
          aria-label={localize('identity.pickerTitle', 'Choose identity')}
          onClick={onOpenIdentityPicker}
        >
          <CircleUserRound size={26} strokeWidth={1.6} />
        </button>
      )}
      <button
        className={
          hasText
            ? cx(styles.Button.Send, styles.DiaryChatFooter.SendSize)
            : styles.DiaryChatFooter.PlusButton
        }
        type='button'
        data-test-id={hasText ? DiaryChat.send : DiaryChat.more}
        title={hasText ? localize('common.send', 'Send') : 'More'}
        aria-label={hasText ? localize('common.send', 'Send') : 'More'}
        onPointerDown={(event) => {
          if (hasText) {
            event.preventDefault();
          }
        }}
        onClick={() => {
          if (hasText) {
            onSendText();
            return;
          }
          if (!plusOpen) {
            textareaRef.current?.blur();
          }
          onTogglePlusPanel();
        }}
      >
        {hasText ? localize('common.send', 'Send') : <CirclePlus size={30} strokeWidth={1.6} />}
      </button>
    </div>
  );
}
