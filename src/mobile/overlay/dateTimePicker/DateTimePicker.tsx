import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DateTimePickerController } from './DateTimePickerController';
import {
  dateToParts,
  daysInMonth,
  pad2,
  range,
  WHEEL_TYPES,
  type DateTimeParts,
  type WheelType,
} from './dateTimePickerUtils';
import { TimeWheel } from './TimeWheel';

export function DateTimePicker() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<DateTimePickerController>(
    OverlayEnum.dateTimePicker,
  );
  const [parts, setParts] = useState<DateTimeParts>(() => dateToParts(new Date()));
  const handleCancel = useCallback(() => {
    controller?.cancel();
  }, [controller]);
  useBackButton(controller ? handleCancel : undefined);

  useEffect(() => {
    if (!controller) return;
    setParts(dateToParts(controller.value));
  }, [controller]);

  const wheelValues = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const selectedYear = controller?.value.getFullYear() ?? currentYear;
    const minYear = Math.min(1970, selectedYear);
    const maxYear = Math.max(currentYear + 1, selectedYear);
    return {
      year: range(minYear, maxYear),
      month: range(1, 12),
      day: range(1, daysInMonth(parts.year, parts.month)),
      hour: range(0, 23),
      minute: range(0, 59),
    } satisfies Record<WheelType, number[]>;
  }, [controller, parts.month, parts.year]);

  const labels = {
    year: localize('diary.timePicker.year', 'Year'),
    month: localize('diary.timePicker.month', 'Month'),
    day: localize('diary.timePicker.day', 'Day'),
    hour: localize('diary.timePicker.hour', 'Hour'),
    minute: localize('diary.timePicker.minute', 'Minute'),
  } satisfies Record<WheelType, string>;

  const testIds = {
    year: DiaryChat.editTimeYearWheel,
    month: DiaryChat.editTimeMonthWheel,
    day: DiaryChat.editTimeDayWheel,
    hour: DiaryChat.editTimeHourWheel,
    minute: DiaryChat.editTimeMinuteWheel,
  } satisfies Record<WheelType, string>;

  const formatValue = useCallback((type: WheelType, value: number) => {
    switch (type) {
      case 'year':
        return localize('diary.timePicker.yearValue', '{0}', value);
      case 'month':
        return localize('diary.timePicker.monthValue', '{0}', pad2(value));
      case 'day':
        return localize('diary.timePicker.dayValue', '{0}', pad2(value));
      case 'hour':
        return localize('diary.timePicker.hourValue', '{0}', pad2(value));
      case 'minute':
        return localize('diary.timePicker.minuteValue', '{0}', pad2(value));
    }
  }, []);

  const handleSettle = useCallback((type: WheelType, value: number) => {
    setParts((current) => {
      const next = { ...current, [type]: value };
      if (type === 'year' || type === 'month') {
        next.day = Math.min(next.day, daysInMonth(next.year, next.month));
      }
      return next;
    });
  }, []);

  if (!controller) return null;

  const confirm = () => {
    const source = controller.value;
    controller.confirm(
      new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        source.getSeconds(),
        source.getMilliseconds(),
      ),
    );
  };

  return (
    <div
      className={styles.DateTimePicker.Root}
      role='dialog'
      aria-modal='true'
      aria-labelledby='date-time-picker-title'
      data-test-id={controller.rootTestId}
      style={{ zIndex: controller.zIndex }}
    >
      <div className={styles.DateTimePicker.Backdrop} aria-hidden='true' onClick={handleCancel} />
      <div className={styles.DateTimePicker.Sheet}>
        <div className={styles.DateTimePicker.Header}>
          <button
            type='button'
            className={styles.DateTimePicker.CancelButton}
            data-test-id={controller.cancelTestId}
            onClick={handleCancel}
          >
            {localize('common.cancel', 'Cancel')}
          </button>
          <span id='date-time-picker-title' className={styles.DateTimePicker.Title}>
            {controller.title}
          </span>
          <button
            type='button'
            className={styles.DateTimePicker.ConfirmButton}
            data-test-id={controller.confirmTestId}
            onClick={confirm}
          >
            {localize('diary.timePicker.confirm', 'Done')}
          </button>
        </div>
        <div className={styles.DateTimePicker.Wheels}>
          {WHEEL_TYPES.map((type) => (
            <TimeWheel
              key={type}
              type={type}
              ariaLabel={labels[type]}
              testId={testIds[type]}
              values={wheelValues[type]}
              value={parts[type]}
              formatValue={formatValue}
              onSettle={handleSettle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
