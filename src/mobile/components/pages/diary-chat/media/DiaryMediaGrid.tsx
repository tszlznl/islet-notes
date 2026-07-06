import type { ImageAttachmentRecord } from '@/core/diary/type';
import type { NotebookMediaMonthGroup } from '@/core/state/mediaGallery';
import { getDateFnsLocale } from '@/locales/common/locale';
import { styles } from '@/mobile/styles/ui';
import { DiaryMedia } from '@/mobile/test.id';
import { localize } from '@/nls';
import { format } from 'date-fns';
import React from 'react';
import { DiaryMediaImageCell } from './DiaryMediaImageCell';
import { DiaryMediaVideoCell } from './DiaryMediaVideoCell';

interface DiaryMediaGridProps {
  groups: NotebookMediaMonthGroup[];
  previewImages: ImageAttachmentRecord[];
}

export function DiaryMediaGrid({ groups, previewImages }: DiaryMediaGridProps) {
  const locale = getDateFnsLocale();
  return (
    <>
      {groups.map((group) => (
        <section key={group.monthKey} className={styles.DiaryMediaPage.Section}>
          <h2 className={styles.DiaryMediaPage.MonthTitle} data-test-id={DiaryMedia.month}>
            {format(group.monthStart, localize('calendar.monthTitleFormat', 'MMMM yyyy'), {
              locale,
            })}
          </h2>
          <div className={styles.DiaryMediaPage.Grid}>
            {group.items.map((item) =>
              item.image ? (
                <DiaryMediaImageCell
                  key={item.entry.id}
                  attachment={item.image}
                  previewImages={previewImages}
                />
              ) : item.video ? (
                <DiaryMediaVideoCell key={item.entry.id} attachment={item.video} />
              ) : null,
            )}
          </div>
        </section>
      ))}
    </>
  );
}
