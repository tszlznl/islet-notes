import { formatRecordingElapsedDuration } from '@/base/just-vibes/media-metrics';
import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { cx, styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { X } from 'lucide-react';
import React from 'react';
import { VoiceRecordingController } from './VoiceRecordingController';

// 声纹以中心为最新采样,向两侧对称扩散。数组保存每根 bar 到中心的距离。
const WAVEFORM_BAR_COUNT = 13;
const WAVEFORM_BARS = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) =>
  Math.abs(index - (WAVEFORM_BAR_COUNT - 1) / 2),
);

export function VoiceRecordingOverlay() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<VoiceRecordingController>(
    OverlayEnum.voiceRecording,
  );
  useWatchEvent(controller?.onStatusChange);
  useBackButton(controller ? () => controller.abort() : undefined);

  if (!controller || !controller.recording) return null;

  const { willCancel, showCountdown, countdown } = controller;
  const levels = controller.levels;

  return (
    <div
      className={styles.VoiceRecording.Overlay}
      style={{ zIndex: controller.zIndex }}
      data-test-id={DiaryChat.recordingOverlay}
    >
      <div
        className={styles.VoiceRecording.Panel}
        data-test-id={willCancel ? DiaryChat.recordingCancel : undefined}
      >
        <span
          className={cx(
            styles.VoiceRecording.Timer,
            showCountdown ? styles.VoiceRecording.TimerWarning : styles.VoiceRecording.TimerNormal,
          )}
        >
          {showCountdown
            ? localize('diary.voice.countdownHint', '{0}s left', countdown)
            : formatRecordingElapsedDuration(controller.elapsed)}
        </span>
        {willCancel ? (
          <div className={styles.VoiceRecording.CancelIconBox}>
            <X size={26} strokeWidth={2.4} className={styles.VoiceRecording.CancelIcon} />
          </div>
        ) : (
          <div className={styles.VoiceRecording.Waveform}>
            {WAVEFORM_BARS.map((distance, index) => {
              const level = levels[levels.length - 1 - distance] ?? 0;
              return (
                <span
                  key={index}
                  className={styles.VoiceRecording.WaveformBar}
                  style={{ height: `${6 + Math.round(level * 24)}px` }}
                />
              );
            })}
          </div>
        )}
        <span
          className={cx(
            styles.VoiceRecording.Hint,
            willCancel ? styles.VoiceRecording.HintCancel : styles.VoiceRecording.HintDefault,
          )}
        >
          {willCancel
            ? localize('diary.voice.releaseToCancel', 'Release to cancel')
            : localize('diary.voice.slideUpToCancel', 'Slide up to cancel')}
        </span>
      </div>
    </div>
  );
}
