import { getIdentityById } from '@/core/diary/selectors';
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
import { Navigate, useParams } from 'react-router';

export function IdentityMessageColorPage() {
  const { identityId } = useParams();
  const model = useDiaryModel();
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const { status: membershipStatus, isLoading: membershipLoading } = useMembershipStatus();
  const identity = identityId ? getIdentityById(model, identityId) : undefined;

  if (!identity || !identityId) {
    return <Navigate to='/identities' replace />;
  }

  return (
    <HeaderPage
      pageTestId={MessageColorUI.identityPage}
      contentTestId={MessageColorUI.content}
      header={{ title: localize('messageColor.title', 'Message color'), showBack: true }}
    >
      <MessageColorPicker
        value={identity.messageColor}
        vipEnabled={membershipStatus.active}
        vipLoading={membershipLoading}
        onVipRequired={() => navigationService.navigate({ path: '/settings/membership/purchase' })}
        onChange={(style) => diaryService.updateIdentityMessageColor(identityId, style)}
      />
    </HeaderPage>
  );
}
