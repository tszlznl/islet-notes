import { useService } from '@/hooks/use-service';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useForm, type FormValues } from '@/mobile/hooks/useForm';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { styles } from '@/mobile/styles/ui';
import { MembershipSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import {
  IMembershipService,
  MEMBERSHIP_STATUS_SWR_KEY,
  type MembershipStatus,
} from '@/services/membership/common/membershipService';
import React, { useState } from 'react';
import { mutate } from 'swr';

interface MbdRedeemForm extends FormValues {
  orderId: string;
}

export function SettingsMembershipMianbaoduoPage() {
  const membershipService = useService(IMembershipService);
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [busy, setBusy] = useState(false);
  const mbdForm = useForm<MbdRedeemForm>({
    fields: [
      {
        name: 'orderId',
        label: localize('settings.membership.mbdOrderId', 'Order ID'),
        testId: MembershipSettings.mbdOrderId,
        placeholder: localize('settings.membership.mbdOrderIdPlaceholder', 'Enter order ID'),
        required: true,
      },
    ],
    requiredMessage: (field) =>
      localize('settings.sync.s3.required', '{0} is required.', field.label),
  });

  const runAction = async (action: () => Promise<MembershipStatus>, successMessage: string) => {
    if (busy) return;
    const loadingToast = showLoadingToast();
    setBusy(true);
    try {
      const status = await action();
      await mutate(MEMBERSHIP_STATUS_SWR_KEY, status, { revalidate: false });
      showSuccessToast({ message: successMessage });
      mbdForm.reset();
    } catch (error) {
      showTopTips({
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
      loadingToast.dispose();
    }
  };

  const redeemMbd = () => {
    if (!mbdForm.verify()) return;
    const orderId = String(mbdForm.values.orderId).trim();
    void runAction(
      () => membershipService.redeemMbdOrder(orderId),
      localize('settings.membership.activated', 'Membership activated'),
    );
  };

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.S3SettingsPage.SetupContent}
      pageTestId={MembershipSettings.mbdPage}
      contentTestId={MembershipSettings.mbdContent}
      header={{ tone: 'surface', showBack: true }}
    >
      <FormPage
        title={localize('settings.membership.redeemMbdChannel', 'Redeem MBD')}
        description={localize('settings.membership.mbdRedeemStep', 'Enter order ID to redeem.')}
        actions={[
          {
            label: busy
              ? localize('settings.membership.processing', 'Processing...')
              : localize('settings.membership.redeemMbd', 'Redeem'),
            disabled: busy,
            testId: MembershipSettings.redeemMbd,
            onClick: redeemMbd,
          },
        ]}
      >
        <FormGroup
          title={localize('settings.membership.redeemOrder', 'Redeem order')}
          items={mbdForm.fields}
        />
      </FormPage>
    </HeaderLayoutPage>
  );
}
