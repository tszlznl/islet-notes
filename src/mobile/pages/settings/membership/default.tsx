import { useService } from '@/hooks/use-service';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { MembershipSettings } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';
import { MembershipAccount } from './account';
import { MembershipPageView } from './view';

export function SettingsMembershipPage() {
  const navigationService = useService(INavigationService);
  const { status, isLoading } = useMembershipStatus();

  return (
    <MembershipPageView
      status={status}
      account={<MembershipAccount memberId={status.memberId} />}
      purchaseActions={
        <button
          className={styles.Membership.PurchaseButton}
          type='button'
          data-test-id={MembershipSettings.purchaseEntry}
          disabled={isLoading || !status.configured}
          onClick={() => navigationService.navigate({ path: '/settings/membership/purchase' })}
        >
          {localize('settings.membership.goPurchase', 'Purchase')}
        </button>
      }
    />
  );
}
