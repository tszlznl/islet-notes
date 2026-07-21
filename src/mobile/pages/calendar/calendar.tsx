import { getNotebookById } from '@/core/diary/selectors';
import { dateKey, groupEntriesByDate } from '@/core/state/calendar';
import { BottomTabBar } from '@/mobile/components/BottomTabBar';
import { CalendarCard } from '@/mobile/components/pages/calendar/CalendarCard.view';
import { DayRecords } from '@/mobile/components/pages/calendar/DayRecords';
import { PageHeader } from '@/mobile/components/PageHeader';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { usePreference } from '@/mobile/hooks/usePreference';
import { Calendar } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { CalendarDisplayOrderPreference } from '@/services/preferences/common/appPreferences';
import { startOfDay, startOfMonth } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';

const CALENDAR_SESSION_STATE_KEY = 'islet.calendar.state';

export function CalendarPage() {
  const model = useDiaryModel();
  const navigationService = useService(INavigationService);
  const [displayOrder] = usePreference(CalendarDisplayOrderPreference);
  const [searchParams] = useSearchParams();
  // 带 notebookId 时进入“单个日记本”模式:只展示该日记本的记录,隐藏底部标签栏并显示返回。
  const notebookId = searchParams.get('notebookId') ?? undefined;
  const scopedNotebook = notebookId ? getNotebookById(model, notebookId) : undefined;
  const scoped = Boolean(notebookId);
  const today = startOfDay(new Date());
  const sessionState = scoped ? undefined : getCalendarSessionState();
  const [selectedDate, setSelectedDateState] = useState(() =>
    sessionState?.selectedDateKey ? new Date(`${sessionState.selectedDateKey}T00:00:00`) : today,
  );
  const [visibleMonth, setVisibleMonthState] = useState(() =>
    sessionState?.visibleMonthKey
      ? new Date(`${sessionState.visibleMonthKey}-01T00:00:00`)
      : startOfMonth(selectedDate),
  );

  const recordsByDate = useMemo(() => groupEntriesByDate(model, notebookId), [model, notebookId]);
  const records = recordsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedRecords = displayOrder === 'newest-first' ? [...records].reverse() : records;
  const selectedDateKey = dateKey(selectedDate);
  const visibleMonthKey = getMonthKey(visibleMonth);

  useEffect(() => {
    if (scoped) return;
    sessionStorage.setItem(
      CALENDAR_SESSION_STATE_KEY,
      JSON.stringify({ selectedDateKey, visibleMonthKey }),
    );
  }, [scoped, selectedDateKey, visibleMonthKey]);

  if (scoped && !scopedNotebook) return <Navigate to='/diaries' replace />;

  return (
    <div className={styles.CalendarPage.Root} data-test-id={Calendar.page}>
      <PageHeader
        title={scopedNotebook ? scopedNotebook.name : localize('calendar.title', 'Calendar')}
        showBack={scoped}
      />
      <main className={styles.CalendarPage.Content} data-test-id={Calendar.content}>
        <CalendarCard
          today={today}
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
          recordsByDate={recordsByDate}
          onSelectDate={setSelectedDateState}
          onChangeVisibleMonth={setVisibleMonthState}
        />
        <DayRecords
          date={selectedDate}
          records={selectedRecords}
          onOpenRecord={(record) =>
            navigationService.navigate({
              path: `/diary/${record.entry.notebookId}?targetEntryId=${encodeURIComponent(record.entry.id)}`,
            })
          }
        />
      </main>
      {!scoped && <BottomTabBar active='calendar' />}
    </div>
  );
}

interface CalendarSessionState {
  selectedDateKey?: string;
  visibleMonthKey?: string;
}

function getCalendarSessionState(): CalendarSessionState | undefined {
  const raw = sessionStorage.getItem(CALENDAR_SESSION_STATE_KEY);
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const value = parsed as { selectedDateKey?: unknown; visibleMonthKey?: unknown };
  return {
    selectedDateKey: typeof value.selectedDateKey === 'string' ? value.selectedDateKey : undefined,
    visibleMonthKey: typeof value.visibleMonthKey === 'string' ? value.visibleMonthKey : undefined,
  };
}

function getMonthKey(date: Date): string {
  return dateKey(startOfMonth(date)).slice(0, 7);
}
