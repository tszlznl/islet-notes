import { deriveRecoveryKeyHash } from '@/base/just-vibes/attachment-encryption';
import { appStoreAccountTokenFromMemberId } from '@/base/just-vibes/app-store-account-token';
import {
  createHamsterBaseCloudClient,
  type HamsterBaseCloudClient,
} from '@/base/just-vibes/hamsterbase-cloud';
import { memberIdFromRecoveryKeyHash } from '@/base/just-vibes/member-id';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import {
  APP_STORE_MEMBERSHIP_PRODUCT_ID,
  type AppStoreMembershipProduct,
  NativeAppStoreMembership,
} from '@/services/native/capacitor/plugins/appStoreMembership';
import { definePreference } from '@/services/preferences/common/preference';
import { Emitter, Event } from 'vscf/base/common/event';
import { createDecorator } from 'vscf/platform/instantiation/common';
import { z } from 'zod';

export interface MembershipStatus {
  configured: boolean;
  active: boolean;
  memberId?: string;
  provider?: 'mbd' | 'admin' | 'app-store';
  productId?: string;
  updatedAt?: number;
}

export type AppStoreProduct = AppStoreMembershipProduct;

export const MEMBERSHIP_STATUS_SWR_KEY = 'settings-membership-status';

export const MembershipPurchasedCacheSchema = z.object({
  active: z.literal(true),
  memberId: z.string(),
  provider: z.enum(['mbd', 'admin', 'app-store']).optional(),
  productId: z.string().optional(),
  updatedAt: z.number().optional(),
  cachedAt: z.number(),
});

export const MembershipPurchasedCachePreference = definePreference({
  channel: 'host',
  key: 'settings-membership-purchased',
  schema: MembershipPurchasedCacheSchema.optional(),
  defaultValue: undefined,
});

export interface IMembershipService {
  readonly _serviceBrand: undefined;
  readonly onDidChange: Event<void>;
  getMemberId(): Promise<string | undefined>;
  getStatus(): Promise<MembershipStatus>;
  redeemMbdOrder(orderId: string): Promise<MembershipStatus>;
  getAppStoreProduct(): Promise<AppStoreProduct>;
  purchaseWithAppStore(): Promise<AppStoreMembershipActionResult>;
  restoreAppStorePurchase(): Promise<AppStoreMembershipActionResult>;
}

export type AppStoreMembershipActionResult =
  | { status: 'activated'; membership: MembershipStatus }
  | { status: 'cancelled' | 'pending' | 'not-found' };

export const IMembershipService = createDecorator<IMembershipService>('IMembershipService');

export class MembershipService implements IMembershipService {
  readonly _serviceBrand: undefined;
  private readonly _onDidChange = new Emitter<void>();
  readonly onDidChange = this._onDidChange.event;
  private readonly cloud: HamsterBaseCloudClient = createHamsterBaseCloudClient();

  constructor(
    @IFileAssetService private readonly fileAssetService: IFileAssetService,
    @IHostService private readonly hostService: IHostService,
  ) {}

  async getMemberId(): Promise<string | undefined> {
    const recoveryKeyHash = await this.resolveRecoveryKeyHash();
    if (!recoveryKeyHash) return undefined;
    return memberIdFromRecoveryKeyHash(recoveryKeyHash);
  }

  async getStatus(): Promise<MembershipStatus> {
    const memberId = await this.getMemberId();
    if (!memberId) {
      return { configured: false, active: false };
    }
    try {
      const status = await this.cloud.getMembershipStatus(memberId);
      const nextStatus = { configured: true, ...status };
      await this.syncPurchasedCache(nextStatus);
      return nextStatus;
    } catch (error) {
      const cached = await this.getPurchasedCache(memberId);
      if (cached) return cached;
      throw error;
    }
  }

  async redeemMbdOrder(orderId: string): Promise<MembershipStatus> {
    const memberId = await this.requireMemberId();
    const status = await this.cloud.redeemMbdOrder({ memberId, orderId });
    const nextStatus = { configured: true, ...status };
    await this.syncPurchasedCache(nextStatus);
    this._onDidChange.fire();
    return nextStatus;
  }

  getAppStoreProduct(): Promise<AppStoreProduct> {
    return NativeAppStoreMembership.getProduct({ productId: APP_STORE_MEMBERSHIP_PRODUCT_ID });
  }

  async purchaseWithAppStore(): Promise<AppStoreMembershipActionResult> {
    const memberId = await this.requireMemberId();
    const result = await NativeAppStoreMembership.purchase({
      productId: APP_STORE_MEMBERSHIP_PRODUCT_ID,
      appAccountToken: await appStoreAccountTokenFromMemberId(memberId),
    });
    if (result.status !== 'purchased') return { status: result.status };

    const membership = await this.activateAppStoreTransaction(
      memberId,
      result.signedTransaction,
      'purchase',
    );
    // cloud 已确认权益后再结束 StoreKit 交易；失败时保留 unfinished 交易供稍后恢复。
    await NativeAppStoreMembership.finish({ transactionId: result.transactionId }).catch(
      () => undefined,
    );
    return { status: 'activated', membership };
  }

  async restoreAppStorePurchase(): Promise<AppStoreMembershipActionResult> {
    const memberId = await this.requireMemberId();
    const result = await NativeAppStoreMembership.restore({
      productId: APP_STORE_MEMBERSHIP_PRODUCT_ID,
    });
    if (result.status === 'not-found') return { status: 'not-found' };

    const membership = await this.activateAppStoreTransaction(
      memberId,
      result.signedTransaction,
      'restore',
    );
    return { status: 'activated', membership };
  }

  private async activateAppStoreTransaction(
    memberId: string,
    signedTransaction: string,
    operation: 'purchase' | 'restore',
  ): Promise<MembershipStatus> {
    const status = await this.cloud.redeemAppStoreTransaction({
      memberId,
      signedTransaction,
      operation,
    });
    const nextStatus = { configured: true, ...status };
    await this.syncPurchasedCache(nextStatus);
    this._onDidChange.fire();
    return nextStatus;
  }

  private async syncPurchasedCache(status: MembershipStatus): Promise<void> {
    if (status.active && status.memberId) {
      await this.hostService.savePreference(MembershipPurchasedCachePreference, {
        active: true,
        memberId: status.memberId,
        provider: status.provider,
        productId: status.productId,
        updatedAt: status.updatedAt,
        cachedAt: Date.now(),
      });
      return;
    }
    await this.hostService.clearPreference(MembershipPurchasedCachePreference);
  }

  private async getPurchasedCache(memberId: string): Promise<MembershipStatus | undefined> {
    const cached = this.hostService.getPreference(MembershipPurchasedCachePreference);
    if (!cached || cached.memberId !== memberId) return undefined;
    return {
      configured: true,
      active: true,
      memberId: cached.memberId,
      provider: cached.provider,
      productId: cached.productId,
      updatedAt: cached.updatedAt,
    };
  }

  private async requireMemberId(): Promise<string> {
    const memberId = await this.getMemberId();
    if (!memberId) {
      throw new Error('Set up a recovery key before activating membership.');
    }
    return memberId;
  }

  // 会员身份优先复用同步配置里已保存的 recoveryKeyHash，仅当只存明文 recoveryKey 时才现算，
  // 与 appPreferences.getRecoveryKeyHash 保持一致。
  private async resolveRecoveryKeyHash(): Promise<string | undefined> {
    const config = this.fileAssetService.getSyncConfig();
    const savedHash = config?.recoveryKeyHash?.trim();
    if (savedHash) return savedHash;
    const recoveryKey = config?.recoveryKey?.trim();
    if (!recoveryKey) return undefined;
    return deriveRecoveryKeyHash(recoveryKey);
  }
}
