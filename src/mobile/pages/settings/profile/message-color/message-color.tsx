import { useService } from '@/hooks/use-service';
import { MessageColorPicker } from '@/mobile/components/MessageColorPicker';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { MessageColorUI } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

export function ProfileMessageColorPage() {
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const { status: membershipStatus, isLoading: membershipLoading } = useMembershipStatus();

  return (
    <HeaderPage
      pageTestId={MessageColorUI.profilePage}
      contentTestId={MessageColorUI.content}
      header={{ title: localize('messageColor.title', 'Message color'), showBack: true }}
    >
      <MessageColorPicker
        value={model.profile.messageColor}
        vipEnabled={membershipStatus.active}
        vipLoading={membershipLoading}
        onVipRequired={() => navigationService.navigate({ path: '/settings/membership/purchase' })}
        onChange={(style) => diaryService.updateProfileMessageColor(style)}
      />
    </HeaderPage>
  );
}
