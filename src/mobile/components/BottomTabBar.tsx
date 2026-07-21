import { localize } from '@/nls';
import { BottomTab } from '@/mobile/test.id';
import { styles, zIndex } from '@/mobile/styles/ui';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { BookOpenText, CalendarDays, UserRound } from 'lucide-react';
import React from 'react';
import { useService } from '@/hooks/use-service';
import { TabButton } from './TabButton';

interface BottomTabBarProps {
  active: 'diary' | 'calendar' | 'me';
}

export function BottomTabBar({ active }: BottomTabBarProps) {
  const navigationService = useService(INavigationService);
  return (
    <nav
      className={styles.BottomTabBar.Root}
      data-test-id={BottomTab.root}
      style={{ zIndex: zIndex.bottomTabBar }}
    >
      <TabButton
        label={localize('tab.diary', 'Diary')}
        icon={<BookOpenText size={24} />}
        testId={BottomTab.diary}
        isActive={active === 'diary'}
        onClick={() => navigationService.navigate({ path: '/diaries', transition: 'none' })}
      />
      <TabButton
        label={localize('tab.calendar', 'Calendar')}
        icon={<CalendarDays size={24} />}
        testId={BottomTab.calendar}
        isActive={active === 'calendar'}
        onClick={() => navigationService.navigate({ path: '/calendar', transition: 'none' })}
      />
      <TabButton
        label={localize('tab.settings', 'My')}
        icon={<UserRound size={24} />}
        testId={BottomTab.settings}
        isActive={active === 'me'}
        onClick={() => navigationService.navigate({ path: '/me', transition: 'none' })}
      />
    </nav>
  );
}
