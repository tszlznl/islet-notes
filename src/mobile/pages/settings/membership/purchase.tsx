import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { MembershipSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';

const MBD_MEMBERSHIP_URL = 'https://mbd.pub/o/bread/YZaTm5lqZg==';

export function SettingsMembershipPurchasePage() {
  const navigationService = useService(INavigationService);

  return (
    <HeaderPage
      pageTestId={MembershipSettings.purchasePage}
      contentTestId={MembershipSettings.purchaseContent}
      header={{
        title: localize('settings.membership.purchase', 'Purchase'),
        showBack: true,
      }}
    >
      <CellListGroup
        items={[
          {
            label: localize('settings.membership.purchaseMbd', 'Purchase on MBD'),
            testId: MembershipSettings.mbdPurchaseLink,
            onClick: () => window.open(MBD_MEMBERSHIP_URL, '_blank', 'noopener,noreferrer'),
          },
          {
            label: localize('settings.membership.redeemMbdChannel', 'Redeem MBD'),
            testId: MembershipSettings.mbdChannel,
            onClick: () =>
              navigationService.navigate({ path: '/settings/membership/purchase/mianbaoduo' }),
          },
        ]}
      />
    </HeaderPage>
  );
}
