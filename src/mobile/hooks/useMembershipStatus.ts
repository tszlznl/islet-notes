import { useService } from '@/hooks/use-service';
import {
  IMembershipService,
  MEMBERSHIP_STATUS_SWR_KEY,
  type MembershipStatus,
} from '@/services/membership/common/membershipService';
import useSWR, { type SWRConfiguration } from 'swr';

export const DEFAULT_MEMBERSHIP_STATUS: MembershipStatus = {
  configured: false,
  active: false,
};

export function useMembershipStatus(options?: SWRConfiguration<MembershipStatus>) {
  const membershipService = useService(IMembershipService);
  const result = useSWR(MEMBERSHIP_STATUS_SWR_KEY, () => membershipService.getStatus(), {
    dedupingInterval: 0,
    ...options,
  });

  return {
    ...result,
    status: result.data ?? DEFAULT_MEMBERSHIP_STATUS,
  };
}
