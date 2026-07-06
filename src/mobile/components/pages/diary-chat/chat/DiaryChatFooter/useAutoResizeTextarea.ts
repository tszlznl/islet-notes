import { useLayoutEffect, type RefObject } from 'react';

const TEXTAREA_MIN_HEIGHT = 36;
const TEXTAREA_MAX_HEIGHT = 116;

export function useAutoResizeTextarea(textareaRef: RefObject<HTMLTextAreaElement>, value: string) {
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.max(
      TEXTAREA_MIN_HEIGHT,
      Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT),
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [textareaRef, value]);
}
