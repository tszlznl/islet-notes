import { registerPlugin } from '@capacitor/core';

export const APP_STORE_MEMBERSHIP_PRODUCT_ID = 'islet.premium';

export interface AppStoreMembershipProduct {
  productId: string;
  displayName: string;
  description: string;
  displayPrice: string;
}

export type AppStorePurchaseResult =
  | {
      status: 'purchased';
      productId: string;
      transactionId: string;
      signedTransaction: string;
    }
  | { status: 'cancelled' | 'pending' };

export type AppStoreRestoreResult =
  | {
      status: 'restored';
      productId: string;
      transactionId: string;
      signedTransaction: string;
    }
  | { status: 'not-found' };

interface AppStoreMembershipPlugin {
  getProduct(options: { productId: string }): Promise<AppStoreMembershipProduct>;
  purchase(options: {
    productId: string;
    appAccountToken: string;
  }): Promise<AppStorePurchaseResult>;
  restore(options: { productId: string }): Promise<AppStoreRestoreResult>;
  finish(options: { transactionId: string }): Promise<void>;
}

const nativePlugin = registerPlugin<AppStoreMembershipPlugin>('AppStoreMembership');

// 以具名方法包一层 Capacitor Proxy，既固定公开入口，也便于业务层黑盒测试。
export const NativeAppStoreMembership: AppStoreMembershipPlugin = {
  getProduct: (options) => nativePlugin.getProduct(options),
  purchase: (options) => nativePlugin.purchase(options),
  restore: (options) => nativePlugin.restore(options),
  finish: (options) => nativePlugin.finish(options),
};
