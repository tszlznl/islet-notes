const DEFAULT_BASE_URL = 'https://cloud.hamsterbase.com/api/membership/v1';
const DEFAULT_PRODUCT_NAME = 'islet';

export interface HamsterBaseMembershipStatus {
  productName?: string;
  memberId: string;
  active: boolean;
  provider?: 'mbd' | 'admin';
  productId?: string;
  updatedAt?: number;
}

export interface RedeemMbdOrderInput {
  memberId: string;
  orderId: string;
}

export interface HamsterBaseCloudClientOptions {
  /** 覆盖默认接口地址，通常用于本地开发或自建服务端；为空时指向 cloud.hamsterbase.com。 */
  baseUrl?: string;
  /** 业务产品名，默认 islet。 */
  productName?: string;
}

export interface HamsterBaseCloudClient {
  getMembershipStatus(memberId: string): Promise<HamsterBaseMembershipStatus>;
  redeemMbdOrder(input: RedeemMbdOrderInput): Promise<HamsterBaseMembershipStatus>;
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
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const productName = options.productName || DEFAULT_PRODUCT_NAME;

  return {
    getMembershipStatus(memberId) {
      const query = `productName=${encodeURIComponent(productName)}&memberId=${encodeURIComponent(memberId)}`;
      return request<HamsterBaseMembershipStatus>(baseUrl, `status?${query}`);
    },
    redeemMbdOrder({ memberId, orderId }) {
      return request<HamsterBaseMembershipStatus>(baseUrl, 'redeem/mbd', {
        method: 'POST',
        body: { productName, memberId, orderId },
      });
    },
  };
}

async function request<T>(
  baseUrl: string,
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
  },
): Promise<T> {
  const response = await fetch(`${baseUrl}/${path}`, {
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
