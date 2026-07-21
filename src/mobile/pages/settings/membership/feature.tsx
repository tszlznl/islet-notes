import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { Check, type LucideIcon } from 'lucide-react';
import React from 'react';

interface MembershipFeatureProps {
  active: boolean;
  description: string;
  icon: LucideIcon;
  testId: string;
  title: string;
}

export function MembershipFeature({
  active,
  description,
  icon: Icon,
  testId,
  title,
}: MembershipFeatureProps) {
  return (
    <div className={styles.Membership.FeatureRow} data-test-id={testId}>
      <div className={styles.Membership.FeatureIcon}>
        <Icon aria-hidden='true' />
      </div>
      <div className={styles.Membership.FeatureBody}>
        <p className={styles.Membership.FeatureTitle}>{title}</p>
        <p className={styles.Membership.FeatureDesc}>{description}</p>
      </div>
      {active ? (
        <span className={styles.Membership.FeatureBadge}>
          {localize('settings.membership.unlocked', 'Unlocked')}
        </span>
      ) : (
        <Check size={18} className={styles.Membership.FeatureCheck} aria-hidden='true' />
      )}
    </div>
  );
}
