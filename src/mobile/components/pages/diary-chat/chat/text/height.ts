import { layout, prepare } from '@chenglou/pretext';

const MESSAGE_VISIBLE_GAP = 10;
const TEXT_MESSAGE_MIN_HEIGHT = 40;
const TEXT_MESSAGE_VERTICAL_PADDING = 16;
/** 气泡内引用块：单行 Footnote(16) + py-1(8) + mb-1(4)。 */
const TEXT_MESSAGE_QUOTE_HEIGHT = 28;
const TEXT_FONT = '17px PingFang SC';
const TEXT_WHITE_SPACE = 'pre-wrap';

const textHeightCache = new Map<string, number>();

export function estimateTextMessageHeight(
  text: string | undefined,
  containerWidth: number,
  hasQuote = false,
) {
  const maxBubbleWidth = Math.min(containerWidth * 0.72, 340) - 24;
  const normalizedText = text ?? '';
  const cacheKey = `${maxBubbleWidth}:${TEXT_FONT}:${TEXT_WHITE_SPACE}:${hasQuote ? 'q' : ''}:${normalizedText}`;
  const cached = textHeightCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const measured = layout(
    prepare(normalizedText, TEXT_FONT, { whiteSpace: TEXT_WHITE_SPACE }),
    maxBubbleWidth,
    24,
  );
  const bubbleHeight = Math.max(
    TEXT_MESSAGE_MIN_HEIGHT,
    measured.height + TEXT_MESSAGE_VERTICAL_PADDING + (hasQuote ? TEXT_MESSAGE_QUOTE_HEIGHT : 0),
  );
  const height = bubbleHeight + MESSAGE_VISIBLE_GAP;
  textHeightCache.set(cacheKey, height);
  return height;
}
