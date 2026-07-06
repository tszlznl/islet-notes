import { cx, styles } from '@/mobile/styles/ui';
import { Wifi } from 'lucide-react';
import React from 'react';

export interface AudioWaveIconProps {
  playing: boolean;
  /** 气泡方向,决定喇叭口朝向;默认右侧气泡(喇叭口朝左)。 */
  align?: 'left' | 'right';
  className?: string;
}

export function AudioWaveIcon({ playing, align, className }: AudioWaveIconProps) {
  return (
    <Wifi
      size={20}
      strokeWidth={2.1}
      className={cx(
        styles.ChatAudio.AudioWaveIcon,
        align === 'left' ? styles.ChatAudio.AudioWaveIconLeft : styles.ChatAudio.AudioWaveIconRight,
        playing && styles.ChatAudio.AudioWavePlaying,
        className,
      )}
      aria-hidden='true'
    />
  );
}
