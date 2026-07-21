export const ITEM_HEIGHT = 44;
export const ROWS = 5;
export const PAD = (ROWS - 1) / 2;
export const WHEEL_TYPES = ['year', 'month', 'day', 'hour', 'minute'] as const;

export type WheelType = (typeof WHEEL_TYPES)[number];

export interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function range(start: number, end: number): number[] {
  const values: number[] = [];
  for (let value = start; value <= end; value += 1) values.push(value);
  return values;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function dateToParts(date: Date): DateTimeParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}
