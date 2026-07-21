import { useService } from '@/hooks/use-service';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { styles } from '@/mobile/styles/ui';
import { MembershipSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';

interface MembershipAccountProps {
  memberId?: string;
}

export function MembershipAccount({ memberId }: MembershipAccountProps) {
  const hostService = useService(IHostService);
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [copied, setCopied] = useState(false);

  const copyMemberId = async () => {
    if (!memberId) return;
    try {
      await hostService.writeToClipboard(memberId);
      setCopied(true);
      showSuccessToast({
        message: localize('common.copied', 'Copied'),
        onDone: () => setCopied(false),
      });
    } catch (error) {
      setCopied(false);
      showTopTips({ message: error instanceof Error ? error.message : String(error) });
    }
  };

  const copyLabel = copied ? localize('common.copied', 'Copied') : localize('common.copy', 'Copy');

  return (
    <>
      <p className={styles.Membership.AccountLabel}>
        {localize('settings.membership.memberId', 'Account ID')}
      </p>
      <section className={styles.Membership.Card}>
        <span className={styles.Membership.AccountId} data-test-id={MembershipSettings.memberId}>
          {memberId ?? localize('settings.membership.notConfigured', 'Not configured')}
        </span>
        <button
          className={styles.Membership.CopyButton}
          type='button'
          disabled={!memberId}
          aria-label={copyLabel}
          title={copyLabel}
          onClick={() => void copyMemberId()}
        >
          {copied ? <Check size={15} aria-hidden='true' /> : <Copy size={15} aria-hidden='true' />}
        </button>
      </section>
    </>
  );
}
