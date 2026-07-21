import { layout, prepare } from '@chenglou/pretext';

const MESSAGE_VISIBLE_GAP = 10;
const TEXT_MESSAGE_MIN_HEIGHT = 40;
const TEXT_MESSAGE_VERTICAL_PADDING = 16;
/** 气泡内引用块：单行 Footnote(16) + py-1(8) + mb-1(4)。 */
const TEXT_MESSAGE_QUOTE_HEIGHT = 28;
/** 与 main.css 的 --font-sans 保持一致，否则估算字宽与真实渲染会漂移。 */
export const MESSAGE_TEXT_FONT = "17px 'PingFang SC', 'Helvetica Neue', Arial, sans-serif";
export const MESSAGE_TEXT_LINE_HEIGHT = 24;
const TEXT_WHITE_SPACE = 'pre-wrap';

/** 与 TextMessage.Root 的 max-w-[min(72vw,340px)] 及 px-3 保持一致。 */
export function getMessageTextMaxWidth(viewportWidth: number) {
  return Math.min(viewportWidth * 0.72, 340) - 24;
}

const textHeightCache = new Map<string, number>();

/**
 * 气泡使用 word-break:break-all,其断点是 pretext(UAX-14 软断点)的超集,贪心排版下
 * 估算行数恒 ≥ 真实行数:高度只会偶尔多出一行的余量,不会低估导致行间重叠。
 */
export function estimateTextMessageHeight(
  text: string | undefined,
  viewportWidth: number,
  hasQuote = false,
) {
  const maxBubbleWidth = getMessageTextMaxWidth(viewportWidth);
  const normalizedText = text ?? '';
  const cacheKey = `${maxBubbleWidth}:${hasQuote ? 'q' : ''}:${normalizedText}`;
  const cached = textHeightCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const measured = layout(
    prepare(normalizedText, MESSAGE_TEXT_FONT, { whiteSpace: TEXT_WHITE_SPACE }),
    maxBubbleWidth,
    MESSAGE_TEXT_LINE_HEIGHT,
  );
  const bubbleHeight = Math.max(
    TEXT_MESSAGE_MIN_HEIGHT,
    measured.height + TEXT_MESSAGE_VERTICAL_PADDING + (hasQuote ? TEXT_MESSAGE_QUOTE_HEIGHT : 0),
  );
  const height = bubbleHeight + MESSAGE_VISIBLE_GAP;
  textHeightCache.set(cacheKey, height);
  return height;
}
