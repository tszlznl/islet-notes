import type { CalendarDayRecord } from '@/core/state/calendar';
import { styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { localize } from '@/nls';
import { format } from 'date-fns';
import React from 'react';
import { CalendarRecordAudio } from './CalendarRecordAudio';
import { CalendarRecordImage } from './CalendarRecordImage';
import { CalendarRecordText } from './CalendarRecordText';
import { CalendarRecordVideo } from './CalendarRecordVideo';

interface DayRecordItemProps {
  record: CalendarDayRecord;
  imagePreviewAttachments: NonNullable<CalendarDayRecord['image']>[];
  onOpen: () => void;
}

export function DayRecordItem({ record, imagePreviewAttachments, onOpen }: DayRecordItemProps) {
  const content = (
    <>
      <span className={styles.DayRecordItem.NotebookName}>
        {record.identityName
          ? `${record.notebookName} · ${record.identityName}`
          : record.notebookName}
      </span>
      {record.image ? (
        <CalendarRecordImage
          attachment={record.image}
          previewAttachments={imagePreviewAttachments}
        />
      ) : record.video ? (
        <CalendarRecordVideo record={record} />
      ) : record.audio ? (
        <CalendarRecordAudio attachment={record.audio} text={record.entry.text} />
      ) : (
        <CalendarRecordText text={record.entry.text ?? ''} />
      )}
    </>
  );

  return (
    <article className={styles.DayRecordItem.Root} data-test-id={Calendar.recordItem}>
      <time className={styles.DayRecordItem.Time} data-test-id={Calendar.recordTime}>
        {format(record.entry.createdAt, 'HH:mm')}
      </time>
      <span className={styles.DayRecordItem.Point} aria-hidden='true' />
      {record.image || record.video || record.audio ? (
        <div className={styles.DayRecordItem.MediaBody}>
          <button
            className={styles.DayRecordItem.MediaOpenButton}
            type='button'
            aria-label={localize('calendar.openRecord', 'Open entry')}
            onClick={onOpen}
          />
          <div className={styles.DayRecordItem.MediaContent}>{content}</div>
        </div>
      ) : (
        <button className={styles.DayRecordItem.Body} type='button' onClick={onOpen}>
          {content}
        </button>
      )}
    </article>
  );
}
