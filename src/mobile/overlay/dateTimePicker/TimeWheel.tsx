import { styles } from '@/mobile/styles/ui';
import React, { useCallback, useEffect, useRef } from 'react';
import { ITEM_HEIGHT, PAD, ROWS, type WheelType } from './dateTimePickerUtils';

interface TimeWheelProps {
  type: WheelType;
  ariaLabel: string;
  testId?: string;
  values: number[];
  value: number;
  formatValue: (type: WheelType, value: number) => string;
  onSettle: (type: WheelType, value: number) => void;
}

export function TimeWheel({
  type,
  ariaLabel,
  testId,
  values,
  value,
  formatValue,
  onSettle,
}: TimeWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number>();
  const raf = useRef<number>();

  const applyCurve = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const center = el.scrollTop + (ROWS * ITEM_HEIGHT) / 2;
    el.querySelectorAll<HTMLElement>('[data-wheel-item]').forEach((item) => {
      const itemCenter = item.offsetTop + ITEM_HEIGHT / 2;
      const distance = (itemCenter - center) / ITEM_HEIGHT;
      const absDistance = Math.abs(distance);
      if (absDistance > PAD + 0.5) {
        item.style.opacity = '0';
        return;
      }
      const rotation = Math.max(-60, Math.min(60, distance * -20));
      item.style.transform = `rotateX(${rotation}deg)`;
      item.style.opacity = String(Math.max(0, 1 - absDistance * 0.28));
    });
  }, []);

  const scrollToValue = useCallback(
    (nextValue: number, behavior: ScrollBehavior = 'auto') => {
      const el = ref.current;
      if (!el) return;
      const index = Math.max(0, values.indexOf(nextValue));
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior });
      requestAnimationFrame(applyCurve);
    },
    [applyCurve, values],
  );

  useEffect(() => {
    scrollToValue(value);
  }, [scrollToValue, value]);

  useEffect(() => {
    return () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, []);

  const readValue = () => {
    const el = ref.current;
    if (!el) return value;
    const index = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT)));
    return values[index] ?? value;
  };

  const handleScroll = () => {
    if (raf.current) window.cancelAnimationFrame(raf.current);
    raf.current = window.requestAnimationFrame(applyCurve);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const nextValue = readValue();
      scrollToValue(nextValue, 'smooth');
      onSettle(type, nextValue);
    }, 90);
  };

  const handleItemClick = (nextValue: number) => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    scrollToValue(nextValue, 'smooth');
    onSettle(type, nextValue);
  };

  return (
    <div
      ref={ref}
      className={styles.DateTimePicker.Wheel}
      role='listbox'
      aria-label={ariaLabel}
      tabIndex={0}
      data-test-id={testId}
      onScroll={handleScroll}
    >
      <div className={styles.DateTimePicker.WheelList}>
        {Array.from({ length: PAD }).map((_, index) => (
          <div key={`start-${index}`} className={styles.DateTimePicker.WheelSpacer} />
        ))}
        {values.map((item) => (
          <div
            key={item}
            className={styles.DateTimePicker.WheelItem}
            role='option'
            aria-selected={item === value}
            data-wheel-item
            data-wheel-value={item}
            onClick={() => handleItemClick(item)}
          >
            {formatValue(type, item)}
          </div>
        ))}
        {Array.from({ length: PAD }).map((_, index) => (
          <div key={`end-${index}`} className={styles.DateTimePicker.WheelSpacer} />
        ))}
      </div>
    </div>
  );
}
