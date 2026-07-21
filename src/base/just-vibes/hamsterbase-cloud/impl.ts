const MEMBERSHIP_API_BASE_URL = 'https://cloud.hamsterbase.com/api/membership/v1';
const DEFAULT_PRODUCT_NAME = 'islet';

export interface HamsterBaseMembershipStatus {
  productName?: string;
  memberId: string;
  active: boolean;
  provider?: 'mbd' | 'admin' | 'app-store';
  productId?: string;
  updatedAt?: number;
}

export interface RedeemMbdOrderInput {
  memberId: string;
  orderId: string;
}

export interface RedeemAppStoreTransactionInput {
  memberId: string;
  signedTransaction: string;
  operation: 'purchase' | 'restore';
}

export interface HamsterBaseCloudClientOptions {
  /** 业务产品名，默认 islet。 */
  productName?: string;
}

export interface HamsterBaseCloudClient {
  getMembershipStatus(memberId: string): Promise<HamsterBaseMembershipStatus>;
  redeemMbdOrder(input: RedeemMbdOrderInput): Promise<HamsterBaseMembershipStatus>;
  redeemAppStoreTransaction(
    input: RedeemAppStoreTransactionInput,
  ): Promise<HamsterBaseMembershipStatus>;
}

type ServerResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: {
        message?: string;
        code?: string | number;
      };
    };

export function createHamsterBaseCloudClient(
  options: HamsterBaseCloudClientOptions = {},
): HamsterBaseCloudClient {
  const productName = options.productName || DEFAULT_PRODUCT_NAME;

  return {
    getMembershipStatus(memberId) {
      const query = `productName=${encodeURIComponent(productName)}&memberId=${encodeURIComponent(memberId)}`;
      return request<HamsterBaseMembershipStatus>(`status?${query}`);
    },
    redeemMbdOrder({ memberId, orderId }) {
      return request<HamsterBaseMembershipStatus>('redeem/mbd', {
        method: 'POST',
        body: { productName, memberId, orderId },
      });
    },
    redeemAppStoreTransaction({ memberId, signedTransaction, operation }) {
      return request<HamsterBaseMembershipStatus>('redeem/app-store', {
        method: 'POST',
        body: { productName, memberId, signedTransaction, operation },
      });
    },
  };
}

async function request<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(`${MEMBERSHIP_API_BASE_URL}/${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json()) as ServerResponse<T>;
  if (!response.ok || !data.success) {
    throw new Error(
      data.success ? response.statusText : data.error?.message || 'Membership request failed.',
    );
  }
  return data.data;
}
