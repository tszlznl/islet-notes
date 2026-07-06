// @islet-import-scope same-dir

import { cx, styles } from '@/mobile/styles/ui';
import { Check, ChevronRight } from 'lucide-react';
import React from 'react';
import type { CellListItem } from './CellList.types';
import { CellRight } from './CellRight';

export function CellListRows({ items }: { items: CellListItem[] }) {
  return (
    <>
      {items.map((item) => {
        if (item.hide) return null;
        const key = item.key ?? item.label;
        if (item.type === 'option') {
          return (
            <button
              key={key}
              className={cx(styles.CellList.Row, styles.CellList.RowPressable)}
              type='button'
              data-test-id={item.testId}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              <span className={styles.Cell.RowLabel}>{item.label}</span>
              {item.selected && (
                <Check size={24} className={styles.Cell.CheckIcon} strokeWidth={2.2} />
              )}
            </button>
          );
        }
        if (item.type === 'action') {
          return (
            <button
              key={key}
              className={cx(styles.CellList.Action, item.danger && styles.CellList.ActionDanger)}
              type='button'
              data-test-id={item.testId}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          );
        }
        const content = (
          <>
            {item.icon && <span className={styles.CellList.Icon}>{item.icon}</span>}
            <span className={styles.Cell.RowLabel}>{item.label}</span>
            {item.right && <CellRight right={item.right} />}
          </>
        );
        if (!item.onClick) {
          return (
            <div key={key} className={styles.CellList.Row} data-test-id={item.testId}>
              {content}
            </div>
          );
        }
        return (
          <button
            key={key}
            className={cx(styles.CellList.Row, styles.CellList.RowPressable)}
            type='button'
            data-test-id={item.testId}
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {content}
            <ChevronRight size={18} className={styles.CellList.Chevron} strokeWidth={1.9} />
          </button>
        );
      })}
    </>
  );
}
