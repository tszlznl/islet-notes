import { useService } from '@/hooks/use-service';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { cx, styles } from '@/mobile/styles/ui';
import { MembershipSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import type { MembershipStatus } from '@/services/membership/common/membershipService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { BadgeCheck, Crown, Hourglass, Image, type LucideIcon } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { MembershipFeature } from './feature';

interface MembershipPageViewProps {
  account?: ReactNode;
  purchaseActions?: ReactNode;
  status: MembershipStatus;
}

interface MembershipPresentation {
  description: string;
  featureTitle: string;
  icon: LucideIcon;
  iconClassName: string;
  pageTitle: string;
  statusTitle: string;
}

export function MembershipPageView({ account, purchaseActions, status }: MembershipPageViewProps) {
  const navigationService = useService(INavigationService);
  const presentation = membershipPresentation(status.active);
  const HeroIcon = presentation.icon;
  const features = [
    {
      description: localize(
        'settings.membership.feature.chatBackgroundDesc',
        'Set a chat background.',
      ),
      icon: Image,
      testId: MembershipSettings.featureChatBackground,
      title: localize('settings.membership.feature.chatBackground', 'Chat background'),
    },
    {
      description: localize(
        'settings.membership.feature.timeMachineDesc',
        'Send entries to the past or future.',
      ),
      icon: Hourglass,
      testId: MembershipSettings.featureTimeMachine,
      title: localize('settings.membership.feature.timeMachine', 'Time machine'),
    },
  ];

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.GroupedRoot}
      contentClassName={styles.Membership.PageContent}
      pageTestId={MembershipSettings.page}
      contentTestId={MembershipSettings.content}
      header={{ title: presentation.pageTitle, showBack: true }}
    >
      <section className={styles.Membership.HeroCard}>
        <div className={cx(styles.Membership.HeroIcon, presentation.iconClassName)}>
          <HeroIcon aria-hidden='true' />
        </div>
        <p className={styles.Membership.HeroTitle} data-test-id={MembershipSettings.status}>
          {presentation.statusTitle}
        </p>
        <p className={styles.Membership.HeroDesc}>{presentation.description}</p>
      </section>

      {account}

      <div className={styles.Membership.FeatureSectionTitle}>{presentation.featureTitle}</div>
      <section className={styles.Membership.FeatureSection}>
        {features.map((feature) => (
          <MembershipFeature key={feature.testId} active={status.active} {...feature} />
        ))}
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

      {status.active ? null : (
        <div className={styles.Membership.PurchaseActions}>{purchaseActions}</div>
      )}
    </HeaderLayoutPage>
  );
}

function membershipPresentation(active: boolean): MembershipPresentation {
  if (active) {
    return {
      description: localize('settings.membership.activatedDesc', 'Benefits are active.'),
      featureTitle: localize('settings.membership.unlockedFeatures', 'Unlocked'),
      icon: BadgeCheck,
      iconClassName: styles.Membership.HeroIconActive,
      pageTitle: localize('settings.membership.center', 'Membership'),
      statusTitle: localize('settings.membership.activated', 'Membership activated'),
    };
  }
  return {
    description: localize('settings.membership.purchaseDesc', 'One-time, lifetime access.'),
    featureTitle: localize('settings.membership.features', 'Benefits'),
    icon: Crown,
    iconClassName: styles.Membership.HeroIconPurchase,
    pageTitle: localize('settings.membership.open', 'Get membership'),
    statusTitle: localize('settings.membership.open', 'Get membership'),
  };
}
