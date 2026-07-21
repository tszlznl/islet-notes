import { useService } from '@/hooks/use-service';
import { EXPERIENCE_MODE_MEMBERSHIP_STATUS } from '@/mobile/hooks/useMembershipStatus';
import { isExperienceMode } from '@/mobile/utils/experienceMode';
import { IHostService } from '@/services/native/common/hostService';
import React from 'react';
import { SettingsMembershipPage } from './default';
import { IosSettingsMembershipPage } from './ios';
import { MembershipPageView } from './view';

export function SettingsMembershipPageRoute() {
  const hostService = useService(IHostService);

  if (isExperienceMode()) {
    return <MembershipPageView status={EXPERIENCE_MODE_MEMBERSHIP_STATUS} />;
  }
  if (hostService.platform === 'ios') return <IosSettingsMembershipPage />;
  return <SettingsMembershipPage />;
}
