import { useService } from '@/hooks/use-service';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { styles } from '@/mobile/styles/ui';
import { MembershipSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import {
  IMembershipService,
  MEMBERSHIP_STATUS_SWR_KEY,
  type AppStoreMembershipActionResult,
  type AppStoreProduct,
} from '@/services/membership/common/membershipService';
import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { MembershipAccount } from './account';
import { MembershipPageView } from './view';

export function IosSettingsMembershipPage() {
  const membershipService = useService(IMembershipService);
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [appStoreProduct, setAppStoreProduct] = useState<AppStoreProduct>();
  const [appStoreProductLoading, setAppStoreProductLoading] = useState(false);
  const [appStoreBusy, setAppStoreBusy] = useState<'purchase' | 'restore'>();
  const { status, isLoading } = useMembershipStatus();

  useEffect(() => {
    if (status.active || !status.configured) return;

    let disposed = false;
    setAppStoreProductLoading(true);
    void membershipService
      .getAppStoreProduct()
      .then((product) => {
        if (!disposed) setAppStoreProduct(product);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!disposed) setAppStoreProductLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [membershipService, status.active, status.configured]);

  const reloadAppStoreProduct = async () => {
    if (appStoreProductLoading || appStoreBusy) return;
    setAppStoreProductLoading(true);
    try {
      setAppStoreProduct(await membershipService.getAppStoreProduct());
    } catch (error) {
      showTopTips({ message: appStoreErrorMessage(error) });
    } finally {
      setAppStoreProductLoading(false);
    }
  };

  const runAppStoreAction = async (
    action: 'purchase' | 'restore',
    execute: () => Promise<AppStoreMembershipActionResult>,
  ) => {
    if (appStoreBusy) return;
    const loadingToast = showLoadingToast({ message: appStoreLoadingMessage(action) });
    setAppStoreBusy(action);
    try {
      const result = await execute();
      switch (result.status) {
        case 'cancelled':
          return;
        case 'pending':
          showTopTips({
            message: localize(
              'settings.membership.appStore.pending',
              'The purchase is awaiting approval. After approval, use Restore Purchase to activate membership.',
            ),
          });
          return;
        case 'not-found':
          showTopTips({
            message: localize(
              'settings.membership.appStore.restoreNotFound',
              'No purchase was found. Make sure you are signed in with the Apple Account used to buy membership.',
            ),
          });
          return;
        case 'activated':
          await mutate(MEMBERSHIP_STATUS_SWR_KEY, result.membership, { revalidate: false });
          showSuccessToast({
            message: localize('settings.membership.activated', 'Membership activated'),
          });
      }
    } catch (error) {
      showTopTips({ message: appStoreErrorMessage(error) });
    } finally {
      setAppStoreBusy(undefined);
      loadingToast.dispose();
    }
  };

  const purchaseAppStoreMembership = () => {
    if (!appStoreProduct) {
      void reloadAppStoreProduct();
      return;
    }
    void runAppStoreAction('purchase', () => membershipService.purchaseWithAppStore());
  };

  return (
    <MembershipPageView
      status={status}
      account={<MembershipAccount memberId={status.memberId} />}
      purchaseActions={
        <>
          <button
            className={styles.Membership.PurchaseButton}
            type='button'
            data-test-id={MembershipSettings.purchaseEntry}
            disabled={isLoading || !status.configured || !!appStoreBusy || appStoreProductLoading}
            onClick={purchaseAppStoreMembership}
          >
            {appStorePurchaseLabel(appStoreProduct, appStoreProductLoading)}
          </button>
          <button
            className={styles.Membership.AppStoreRestoreButton}
            type='button'
            data-test-id={MembershipSettings.appStoreRestore}
            disabled={isLoading || !status.configured || !!appStoreBusy}
            onClick={() =>
              void runAppStoreAction('restore', () => membershipService.restoreAppStorePurchase())
            }
          >
            {localize('settings.membership.appStore.restore', 'Restore Purchase')}
          </button>
          <p className={styles.Membership.AppStoreTransferNote}>
            {localize(
              'settings.membership.appStore.restoreTransfer',
              'Restoring transfers this purchase to the current Account ID. The previous Account ID will lose membership access.',
            )}
          </p>
        </>
      }
    />
  );
}

function appStoreLoadingMessage(action: 'purchase' | 'restore'): string {
  return action === 'purchase'
    ? localize('settings.membership.appStore.purchasing', 'Processing purchase...')
    : localize('settings.membership.appStore.restoring', 'Restoring purchase...');
}

function appStorePurchaseLabel(product: AppStoreProduct | undefined, loading: boolean): string {
  if (product) {
    return localize(
      'settings.membership.appStore.buyPrice',
      'Buy with App Store · {0}',
      product.displayPrice,
    );
  }
  return loading
    ? localize('settings.membership.appStore.loadingProduct', 'Loading App Store price...')
    : localize('settings.membership.appStore.reloadProduct', 'Reload App Store product');
}

function appStoreErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : undefined;
  if (code === 'PAYMENTS_NOT_ALLOWED') {
    return localize(
      'settings.membership.appStore.error.notAllowed',
      'App Store purchases are not allowed on this device. Check Screen Time or account restrictions.',
    );
  }
  if (code === 'PRODUCT_NOT_FOUND' || code === 'INVALID_PRODUCT_TYPE') {
    return localize(
      'settings.membership.appStore.error.productUnavailable',
      'The App Store product is temporarily unavailable. Try again later.',
    );
  }
  return localize(
    'settings.membership.appStore.error.purchaseFailed',
    'Membership could not be activated. Check your connection and try again. Your purchase will not be lost; you can restore it later.',
  );
}
