import type { MessageBackgroundValue } from './types';

const MAX_BACKGROUND_LENGTH = 500;
const FALLBACK_COLOR_PATTERN =
  /^(?:#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^;{}]+\)|hsla?\([^;{}]+\)|transparent|currentcolor)$/i;
const FORBIDDEN_FUNCTION_PATTERN = /\b(?:url|var|attr|image|image-set|cross-fade|element)\s*\(/i;

/** 只接受单个 CSS 色值或单个 linear-gradient()，拒绝变量、外部资源和声明注入。 */
export function parseMessageBackground(raw: string): MessageBackgroundValue | undefined {
  const value = raw.trim();
  if (!value || value.length > MAX_BACKGROUND_LENGTH || hasUnsafeCharacters(value)) {
    return undefined;
  }

  if (isSingleLinearGradient(value)) {
    if (FORBIDDEN_FUNCTION_PATTERN.test(value)) return undefined;
    return supportsCss('background-image', value) === false
      ? undefined
      : { type: 'linear-gradient', value };
  }

  if (FORBIDDEN_FUNCTION_PATTERN.test(value)) return undefined;
  const colorSupported = supportsCss('color', value);
  if (
    colorSupported === true ||
    (colorSupported === undefined && FALLBACK_COLOR_PATTERN.test(value))
  ) {
    return { type: 'color', value };
  }
  return undefined;
}

function hasUnsafeCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return (
      codePoint < 0x20 ||
      codePoint === 0x7f ||
      character === ';' ||
      character === '{' ||
      character === '}' ||
      character === '<' ||
      character === '>' ||
      character === '@' ||
      character === '\\'
    );
  });
}

function supportsCss(property: 'color' | 'background-image', value: string): boolean | undefined {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return undefined;
  return CSS.supports(property, value);
}

function isSingleLinearGradient(value: string): boolean {
  const opening = /^linear-gradient\s*\(/i.exec(value);
  if (!opening) return false;

  let depth = 0;
  let quote: '"' | "'" | undefined;
  for (let index = opening[0].length - 1; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')') {
      depth -= 1;
      if (depth === 0) return value.slice(index + 1).trim().length === 0;
      if (depth < 0) return false;
    }
  }
  return false;
}
