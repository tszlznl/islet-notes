import { useService } from '@/hooks/use-service';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { localize } from '@/nls';
import {
  IMembershipService,
  MEMBERSHIP_STATUS_SWR_KEY,
  type MembershipStatus,
} from '@/services/membership/common/membershipService';
import { isExperienceMode } from '@/mobile/utils/experienceMode';
import useSWR from 'swr';

export const DEFAULT_MEMBERSHIP_STATUS: MembershipStatus = {
  configured: false,
  active: false,
};

export const EXPERIENCE_MODE_MEMBERSHIP_STATUS: MembershipStatus = {
  configured: false,
  active: true,
};

export function useMembershipStatus() {
  const membershipService = useService(IMembershipService);
  const showTopTips = useTopTips();
  const experienceMode = isExperienceMode();
  const result = useSWR(
    experienceMode ? null : MEMBERSHIP_STATUS_SWR_KEY,
    () => membershipService.getStatus(),
    {
      dedupingInterval: 0,
      onError: () =>
        showTopTips({
          message: localize(
            'settings.membership.error.loadFailed',
            'Membership information is temporarily unavailable. Try again later.',
          ),
        }),
    },
  );
  const status = experienceMode
    ? EXPERIENCE_MODE_MEMBERSHIP_STATUS
    : (result.data ?? DEFAULT_MEMBERSHIP_STATUS);

  return {
    ...result,
    data: experienceMode ? EXPERIENCE_MODE_MEMBERSHIP_STATUS : result.data,
    isLoading: experienceMode ? false : result.isLoading,
    isValidating: experienceMode ? false : result.isValidating,
    status,
  };
}
