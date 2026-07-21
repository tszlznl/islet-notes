import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { usePreference } from '@/mobile/hooks/usePreference';
import { CalendarDisplaySettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { CalendarDisplayOrderPreference } from '@/services/preferences/common/appPreferences';
import React from 'react';

export function SettingsCalendarDisplayPage() {
  const [displayOrder, setDisplayOrder] = usePreference(CalendarDisplayOrderPreference);

  return (
    <HeaderPage
      pageTestId={CalendarDisplaySettings.page}
      contentTestId={CalendarDisplaySettings.content}
      header={{
        title: localize('settings.calendar', 'Calendar'),
        showBack: true,
      }}
    >
      <CellListGroup
        title={localize('settings.calendar.displayOrder', 'Display order')}
        items={[
          {
            type: 'option',
            label: localize('settings.calendar.newestFirst', 'Newest first'),
            selected: displayOrder === 'newest-first',
            testId: CalendarDisplaySettings.newestFirst,
            onClick: () => void setDisplayOrder('newest-first'),
          },
          {
            type: 'option',
            label: localize('settings.calendar.oldestFirst', 'Oldest first'),
            selected: displayOrder === 'oldest-first',
            testId: CalendarDisplaySettings.oldestFirst,
            onClick: () => void setDisplayOrder('oldest-first'),
          },
        ]}
      />
    </HeaderPage>
  );
}
