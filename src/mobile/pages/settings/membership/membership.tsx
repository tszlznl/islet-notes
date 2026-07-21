import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { MembershipSettings } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import {
  IMembershipService,
  MEMBERSHIP_STATUS_SWR_KEY,
  type AppStoreMembershipActionResult,
  type AppStoreProduct,
} from '@/services/membership/common/membershipService';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { BadgeCheck, Check, Copy, Crown, Hourglass, Image } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';

export function SettingsMembershipPage() {
  const hostService = useService(IHostService);
  const membershipService = useService(IMembershipService);
  const navigationService = useService(INavigationService);
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [copied, setCopied] = useState(false);
  const [appStoreProduct, setAppStoreProduct] = useState<AppStoreProduct>();
  const [appStoreProductLoading, setAppStoreProductLoading] = useState(false);
  const [appStoreBusy, setAppStoreBusy] = useState<'purchase' | 'restore'>();
  const { status, isLoading } = useMembershipStatus({
    onError: (error) => showError(showTopTips, error),
  });
  const isIos = hostService.platform === 'ios';

  useEffect(() => {
    if (!isIos || status.active || !status.configured) return;

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
  }, [isIos, membershipService, status.active, status.configured]);

  const copyMemberId = async () => {
    if (!status.memberId) return;
    try {
      await hostService.writeToClipboard(status.memberId);
      setCopied(true);
      showSuccessToast({
        message: localize('common.copied', 'Copied'),
        onDone: () => setCopied(false),
      });
    } catch (error) {
      setCopied(false);
      showError(showTopTips, error);
    }
  };

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
    const loadingToast = showLoadingToast({
      message:
        action === 'purchase'
          ? localize('settings.membership.appStore.purchasing', 'Processing purchase...')
          : localize('settings.membership.appStore.restoring', 'Restoring purchase...'),
    });
    setAppStoreBusy(action);
    try {
      const result = await execute();
      if (result.status === 'cancelled') return;
      if (result.status === 'pending') {
        showTopTips({
          message: localize(
            'settings.membership.appStore.pending',
            'The purchase is awaiting approval. After approval, use Restore Purchase to activate membership.',
          ),
        });
        return;
      }
      if (result.status === 'not-found') {
        showTopTips({
          message: localize(
            'settings.membership.appStore.restoreNotFound',
            'No purchase was found. Make sure you are signed in with the Apple Account used to buy membership.',
          ),
        });
        return;
      }
      if (result.status !== 'activated') return;

      await mutate(MEMBERSHIP_STATUS_SWR_KEY, result.membership, { revalidate: false });
      showSuccessToast({
        message: localize('settings.membership.activated', 'Membership activated'),
      });
    } catch (error) {
      showTopTips({ message: appStoreErrorMessage(error) });
    } finally {
      setAppStoreBusy(undefined);
      loadingToast.dispose();
    }
  };

  const purchaseLabel = isIos
    ? appStoreProduct
      ? localize(
          'settings.membership.appStore.buyPrice',
          'Buy with App Store · {0}',
          appStoreProduct.displayPrice,
        )
      : appStoreProductLoading
        ? localize('settings.membership.appStore.loadingProduct', 'Loading App Store price...')
        : localize('settings.membership.appStore.reloadProduct', 'Reload App Store product')
    : localize('settings.membership.goPurchase', 'Purchase');

  const pageTitle = status.active
    ? localize('settings.membership.center', 'Membership')
    : localize('settings.membership.open', 'Get membership');

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.GroupedRoot}
      contentClassName={styles.Membership.PageContent}
      pageTestId={MembershipSettings.page}
      contentTestId={MembershipSettings.content}
      header={{ title: pageTitle, showBack: true }}
    >
      <section className={styles.Membership.HeroCard}>
        <div
          className={cx(
            styles.Membership.HeroIcon,
            status.active ? styles.Membership.HeroIconActive : styles.Membership.HeroIconPurchase,
          )}
        >
          {status.active ? <BadgeCheck aria-hidden='true' /> : <Crown aria-hidden='true' />}
        </div>
        <p className={styles.Membership.HeroTitle} data-test-id={MembershipSettings.status}>
          {status.active
            ? localize('settings.membership.activated', 'Membership activated')
            : localize('settings.membership.open', 'Get membership')}
        </p>
        <p className={styles.Membership.HeroDesc}>
          {status.active
            ? localize('settings.membership.activatedDesc', 'Benefits are active.')
            : localize('settings.membership.purchaseDesc', 'One-time, lifetime access.')}
        </p>
      </section>

      <p className={styles.Membership.AccountLabel}>
        {localize('settings.membership.memberId', 'Account ID')}
      </p>
      <section className={styles.Membership.Card}>
        <span className={styles.Membership.AccountId} data-test-id={MembershipSettings.memberId}>
          {status.memberId ?? localize('settings.membership.notConfigured', 'Not configured')}
        </span>
        <button
          className={styles.Membership.CopyButton}
          type='button'
          disabled={!status.memberId}
          aria-label={
            copied ? localize('common.copied', 'Copied') : localize('common.copy', 'Copy')
          }
          title={copied ? localize('common.copied', 'Copied') : localize('common.copy', 'Copy')}
          onClick={() => void copyMemberId()}
        >
          {copied ? <Check size={15} aria-hidden='true' /> : <Copy size={15} aria-hidden='true' />}
        </button>
      </section>

      <div className={styles.Membership.FeatureSectionTitle}>
        {status.active
          ? localize('settings.membership.unlockedFeatures', 'Unlocked')
          : localize('settings.membership.features', 'Benefits')}
      </div>
      <section className={styles.Membership.FeatureSection}>
        <div
          className={styles.Membership.FeatureRow}
          data-test-id={MembershipSettings.featureChatBackground}
        >
          <div className={styles.Membership.FeatureIcon}>
            <Image aria-hidden='true' />
          </div>
          <div className={styles.Membership.FeatureBody}>
            <p className={styles.Membership.FeatureTitle}>
              {localize('settings.membership.feature.chatBackground', 'Chat background')}
            </p>
            <p className={styles.Membership.FeatureDesc}>
              {localize('settings.membership.feature.chatBackgroundDesc', 'Set a chat background.')}
            </p>
          </div>
          {status.active ? (
            <span className={styles.Membership.FeatureBadge}>
              {localize('settings.membership.unlocked', 'Unlocked')}
            </span>
          ) : (
            <Check size={18} className={styles.Membership.FeatureCheck} aria-hidden='true' />
          )}
        </div>
        <div
          className={styles.Membership.FeatureRow}
          data-test-id={MembershipSettings.featureTimeMachine}
        >
          <div className={styles.Membership.FeatureIcon}>
            <Hourglass aria-hidden='true' />
          </div>
          <div className={styles.Membership.FeatureBody}>
            <p className={styles.Membership.FeatureTitle}>
              {localize('settings.membership.feature.timeMachine', 'Time machine')}
            </p>
            <p className={styles.Membership.FeatureDesc}>
              {localize(
                'settings.membership.feature.timeMachineDesc',
                'Send entries to the past or future.',
              )}
            </p>
          </div>
          {status.active ? (
            <span className={styles.Membership.FeatureBadge}>
              {localize('settings.membership.unlocked', 'Unlocked')}
            </span>
          ) : (
            <Check size={18} className={styles.Membership.FeatureCheck} aria-hidden='true' />
          )}
        </div>
      </section>

      {/* 未来消息入口不区分会员：非会员也可能有历史未来消息，需要能查看和删除。 */}
      <CellListGroup
        className={styles.Membership.FutureMessagesGroup}
        items={[
          {
            label: localize('settings.membership.futureMessages', 'Future messages'),
            testId: MembershipSettings.futureMessagesEntry,
            onClick: () =>
              navigationService.navigate({ path: '/settings/membership/future-messages' }),
          },
        ]}
      />

      {!status.active && (
        <div className={styles.Membership.PurchaseActions}>
          <button
            className={styles.Membership.PurchaseButton}
            type='button'
            data-test-id={MembershipSettings.purchaseEntry}
            disabled={
              isLoading || !status.configured || !!appStoreBusy || (isIos && appStoreProductLoading)
            }
            onClick={() => {
              if (!isIos) {
                navigationService.navigate({ path: '/settings/membership/purchase' });
                return;
              }
              if (!appStoreProduct) {
                void reloadAppStoreProduct();
                return;
              }
              void runAppStoreAction('purchase', () => membershipService.purchaseWithAppStore());
            }}
          >
            {purchaseLabel}
          </button>
          {isIos && (
            <>
              <button
                className={styles.Membership.AppStoreRestoreButton}
                type='button'
                data-test-id={MembershipSettings.appStoreRestore}
                disabled={isLoading || !status.configured || !!appStoreBusy}
                onClick={() =>
                  void runAppStoreAction('restore', () =>
                    membershipService.restoreAppStorePurchase(),
                  )
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
          )}
        </div>
      )}
    </HeaderLayoutPage>
  );
}

function showError(showTopTips: ReturnType<typeof useTopTips>, error: unknown) {
  showTopTips({
    message: error instanceof Error ? error.message : String(error),
  });
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
