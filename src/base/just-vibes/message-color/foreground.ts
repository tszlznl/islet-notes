const HEX_COLOR_PATTERN = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-f])/gi;
const RGB_COLOR_PATTERN = /^rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/i;
const foregroundCache = new Map<string, '#000000' | '#ffffff' | null>();

/** 从背景中提取可计算颜色，并选择对比度更高的黑色或白色。 */
export function getMessageForeground(background: string): '#000000' | '#ffffff' | undefined {
  const cached = foregroundCache.get(background);
  if (cached !== undefined) return cached ?? undefined;

  const colors = [...background.matchAll(HEX_COLOR_PATTERN)]
    .map(([hex]) => normalizeHexColor(hex))
    .filter((hex): hex is string => !!hex);
  if (colors.length === 0 && !/^linear-gradient\s*\(/i.test(background)) {
    const normalized = normalizeBrowserColor(background);
    if (normalized) colors.push(normalized);
  }
  if (colors.length === 0) {
    cacheForeground(background, null);
    return undefined;
  }

  const luminances = colors.map(relativeLuminance);
  const blackContrast = Math.min(...luminances.map((luminance) => (luminance + 0.05) / 0.05));
  const whiteContrast = Math.min(...luminances.map((luminance) => 1.05 / (luminance + 0.05)));
  const foreground = blackContrast >= whiteContrast ? '#000000' : '#ffffff';
  cacheForeground(background, foreground);
  return foreground;
}

function cacheForeground(background: string, foreground: '#000000' | '#ffffff' | null) {
  if (foregroundCache.size >= 100) foregroundCache.clear();
  foregroundCache.set(background, foreground);
}

/** 浏览器会把 named/rgb/hsl 等 CSS 色值归一化；渐变不走此分支。 */
function normalizeBrowserColor(color: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return undefined;
  context.fillStyle = '#010203';
  context.fillStyle = color;
  const normalized = context.fillStyle;
  if (normalized.startsWith('#')) return normalizeHexColor(normalized);

  const match = RGB_COLOR_PATTERN.exec(normalized);
  if (!match) return undefined;
  const hex = match
    .slice(1, 4)
    .map((channel) => Math.max(0, Math.min(255, Math.round(Number(channel)))))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

function normalizeHexColor(hex: string): string | undefined {
  const digits = hex.slice(1);
  if (digits.length === 3 || digits.length === 4) {
    return `#${digits
      .slice(0, 3)
      .split('')
      .map((digit) => `${digit}${digit}`)
      .join('')}`;
  }
  if (digits.length === 6 || digits.length === 8) return `#${digits.slice(0, 6)}`;
  return undefined;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
