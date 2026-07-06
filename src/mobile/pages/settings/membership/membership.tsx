import { useService } from '@/hooks/use-service';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { MembershipSettings } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { BadgeCheck, Check, Copy, Crown, Image } from 'lucide-react';
import React, { useState } from 'react';

export function SettingsMembershipPage() {
  const hostService = useService(IHostService);
  const navigationService = useService(INavigationService);
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [copied, setCopied] = useState(false);
  const { status, isLoading } = useMembershipStatus({
    onError: (error) => showError(showTopTips, error),
  });

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

      <section className={styles.Membership.Card}>
        <p className={styles.Membership.AccountLabel}>
          {localize('settings.membership.memberId', 'Account ID')}
        </p>
        <div className={styles.Membership.AccountBox}>
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
            {copied ? (
              <Check size={15} aria-hidden='true' />
            ) : (
              <Copy size={15} aria-hidden='true' />
            )}
          </button>
        </div>
      </section>

      <section className={styles.Membership.FeatureSection}>
        <div className={styles.Membership.FeatureSectionTitle}>
          {status.active
            ? localize('settings.membership.unlockedFeatures', 'Unlocked')
            : localize('settings.membership.features', 'Benefits')}
        </div>
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
            <Check size={18} className='flex-none text-accent' aria-hidden='true' />
          )}
        </div>
      </section>

      {!status.active && (
        <div className={styles.Membership.PurchaseActions}>
          <button
            className={styles.Membership.PurchaseButton}
            type='button'
            data-test-id={MembershipSettings.purchaseEntry}
            disabled={isLoading || !status.configured}
            onClick={() => navigationService.navigate({ path: '/settings/membership/purchase' })}
          >
            {localize('settings.membership.goPurchase', 'Purchase')}
          </button>
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
