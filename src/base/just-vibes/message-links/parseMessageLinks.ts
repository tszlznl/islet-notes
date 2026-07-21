import { find } from 'linkifyjs';

export type MessageTextSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string };

const DEFAULT_PROTOCOL = 'https';
const CJK_URL_BOUNDARY = /[，。！？；：、（）【】《》〈〉「」『』“”‘’…—]/u;
const CJK_URL_BOUNDARY_SPLIT = /([，。！？；：、（）【】《》〈〉「」『』“”‘’…—])/u;
const SCHEME_BEFORE_MATCH = /([a-z][a-z\d+.-]*):(?:\/\/)?$/i;

/** 只识别 HTTP(S) 网页地址；无协议域名统一补全为 HTTPS。 */
export function parseMessageLinks(text: string): MessageTextSegment[] {
  if (!text) return [];

  const segments: MessageTextSegment[] = [];
  let offset = 0;

  // Linkify 会把中文标点和后续文字视为 URL 路径的一部分；先按自然语言标点
  // 切块，既保留中文路径，也能识别紧跟在标点后的下一条链接。
  for (const chunk of text.split(CJK_URL_BOUNDARY_SPLIT)) {
    if (!chunk) continue;
    if (CJK_URL_BOUNDARY.test(chunk)) {
      pushTextSegment(segments, chunk);
      offset += chunk.length;
      continue;
    }

    let cursor = offset;
    for (const match of find(chunk, 'url', { defaultProtocol: DEFAULT_PROTOCOL })) {
      const link = normalizeLinkMatch(text, { ...match, start: offset + match.start });
      if (!link) continue;

      if (link.start > cursor) {
        pushTextSegment(segments, text.slice(cursor, link.start));
      }
      segments.push({ type: 'link', text: link.text, href: link.href });
      cursor = link.end;
    }

    const chunkEnd = offset + chunk.length;
    if (cursor < chunkEnd) {
      pushTextSegment(segments, text.slice(cursor, chunkEnd));
    }
    offset = chunkEnd;
  }
  return segments;
}

interface LinkifyMatch {
  value: string;
  href: string;
  start: number;
}

function normalizeLinkMatch(text: string, match: LinkifyMatch) {
  // Linkify 会把 custom://example.com 中的 example.com 当作裸域名；非 HTTP(S)
  // 协议后的匹配必须整体保留为普通文字。
  const hasExplicitHttpProtocol = /^https?:\/\//i.test(match.value);
  if (!hasExplicitHttpProtocol) {
    const precedingScheme = text.slice(0, match.start).match(SCHEME_BEFORE_MATCH)?.[1];
    if (precedingScheme && !isHttpProtocol(precedingScheme)) return undefined;
  }

  if (!isHttpUrl(match.href)) return undefined;

  return {
    start: match.start,
    end: match.start + match.value.length,
    text: match.value,
    href: match.href,
  };
}

function pushTextSegment(segments: MessageTextSegment[], text: string) {
  if (!text) return;
  const previous = segments.at(-1);
  if (previous?.type === 'text') {
    previous.text += text;
    return;
  }
  segments.push({ type: 'text', text });
}

function isHttpProtocol(protocol: string) {
  const normalized = protocol.toLowerCase();
  return normalized === 'http' || normalized === 'https';
}

function isHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
