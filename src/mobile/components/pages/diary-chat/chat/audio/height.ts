import { layout, prepare } from '@chenglou/pretext';
import {
  MESSAGE_TEXT_FONT,
  MESSAGE_TEXT_LINE_HEIGHT,
  getMessageTextMaxWidth,
} from '../text/height';

const MESSAGE_VISIBLE_GAP = 10;
const TEXT_MESSAGE_MIN_HEIGHT = 40;
const TEXT_MESSAGE_VERTICAL_PADDING = 16;
const AUDIO_MESSAGE_HEIGHT = TEXT_MESSAGE_MIN_HEIGHT + MESSAGE_VISIBLE_GAP;
const AUDIO_TRANSCRIPT_GAP = 6;
/** 识别中的状态行（pill 高 32 + 间距 6）。 */
export const AUDIO_TRANSCRIBING_HEIGHT = 38;

export function estimateAudioMessageHeight(
  text: string | undefined,
  viewportWidth: number,
  transcribing?: boolean,
) {
  if (transcribing) return AUDIO_MESSAGE_HEIGHT + AUDIO_TRANSCRIBING_HEIGHT;
  return AUDIO_MESSAGE_HEIGHT + estimateAudioTranscriptHeight(text, viewportWidth);
}

export function estimateAudioTranscriptHeight(
  text: string | undefined,
  viewportWidth: number,
): number {
  const content = text?.trim();
  if (!content) return 0;
  const measured = layout(
    prepare(content, MESSAGE_TEXT_FONT, { whiteSpace: 'pre-wrap' }),
    getMessageTextMaxWidth(viewportWidth),
    MESSAGE_TEXT_LINE_HEIGHT,
  );
  return (
    Math.max(TEXT_MESSAGE_MIN_HEIGHT, measured.height + TEXT_MESSAGE_VERTICAL_PADDING) +
    AUDIO_TRANSCRIPT_GAP
  );
}
