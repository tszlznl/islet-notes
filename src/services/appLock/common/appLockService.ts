import { deriveRecoveryKeyHash } from '@/base/just-vibes/attachment-encryption';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import { Emitter, Event } from 'vscf/base/common/event';
import { createDecorator } from 'vscf/platform/instantiation/common';
import { AppLockConfigPreference } from './appLockConfig';

export type AppLockEnableResult =
  | { ok: true }
  | { ok: false; error: 'no-recovery-key' | 'invalid-recovery-key' };

export interface IAppLockService {
  readonly _serviceBrand: undefined;
  readonly onDidChange: Event<void>;
  /** 是否已开启身份验证。 */
  readonly enabled: boolean;
  /** 当前是否处于锁定状态，锁定时应展示全屏锁定页。 */
  readonly locked: boolean;
  /** 立即锁定。开启后应用退到后台时自动触发，也可手动调用。 */
  lock(): void;
  /**
   * 开启身份验证。必须提供正确的数据库加密密码（恢复密钥）；
   * 未配置云同步（没有可比对的密钥指纹）时无法开启。
   */
  enable(recoveryKey: string): Promise<AppLockEnableResult>;
  disable(): Promise<void>;
  /** 调起系统身份验证（指纹/面容/设备密码）解锁，通过后解除锁定。 */
  unlockWithDeviceAuth(): Promise<boolean>;
  /** 用数据库加密密码（恢复密钥）解锁，密码错误返回 false。 */
  unlockWithRecoveryKey(recoveryKey: string): Promise<boolean>;
}

export const IAppLockService = createDecorator<IAppLockService>('IAppLockService');

export class AppLockService implements IAppLockService {
  readonly _serviceBrand: undefined;
  private readonly _onDidChange = new Emitter<void>();
  readonly onDidChange = this._onDidChange.event;

  private _enabled: boolean;
  private _locked: boolean;
  private deviceAuthRequest: Promise<boolean> | undefined;

  constructor(
    @IHostService private readonly hostService: IHostService,
    @IFileAssetService private readonly fileAssetService: IFileAssetService,
  ) {
    this._enabled = hostService.getPreference(AppLockConfigPreference).enabled;
    // 冷启动即锁定，避免锁定页出现前先露出内容。
    this._locked = this._enabled;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get locked(): boolean {
    return this._locked;
  }

  lock(): void {
    if (!this._enabled || this._locked) return;
    this._locked = true;
    this._onDidChange.fire();
  }

  async enable(recoveryKey: string): Promise<AppLockEnableResult> {
    const expectedHash = await this.resolveRecoveryKeyHash();
    if (!expectedHash) return { ok: false, error: 'no-recovery-key' };
    if (!(await this.matchesRecoveryKeyHash(recoveryKey, expectedHash))) {
      return { ok: false, error: 'invalid-recovery-key' };
    }
    // 指纹随锁配置持久化：之后即使清除云同步配置，恢复密钥仍可解锁。
    await this.hostService.savePreference(AppLockConfigPreference, {
      enabled: true,
      recoveryKeyHash: expectedHash,
    });
    this._enabled = true;
    this._onDidChange.fire();
    return { ok: true };
  }

  async disable(): Promise<void> {
    await this.hostService.savePreference(AppLockConfigPreference, { enabled: false });
    this._enabled = false;
    this._locked = false;
    this._onDidChange.fire();
  }

  async unlockWithDeviceAuth(): Promise<boolean> {
    if (!this._locked) return true;
    // 自动调起与手动点按可能并发，复用同一次系统验证。
    this.deviceAuthRequest ??= this.hostService
      .requestDeviceAuth({
        title: localize('appLock.deviceAuth.title', 'Verify your identity'),
        subtitle: localize('appLock.deviceAuth.subtitle', 'Unlock Islet Journal to continue'),
        cancelLabel: localize('common.cancel', 'Cancel'),
      })
      .finally(() => {
        this.deviceAuthRequest = undefined;
      });
    const success = await this.deviceAuthRequest;
    if (success) this.setUnlocked();
    return success;
  }

  async unlockWithRecoveryKey(recoveryKey: string): Promise<boolean> {
    // 优先用锁配置里持久化的指纹；仅旧版本开启的锁（未存指纹）才回退到同步配置。
    const savedHash = this.hostService
      .getPreference(AppLockConfigPreference)
      .recoveryKeyHash?.trim();
    const expectedHash = savedHash || (await this.resolveRecoveryKeyHash());
    if (!expectedHash) return false;
    if (!(await this.matchesRecoveryKeyHash(recoveryKey, expectedHash))) return false;
    this.setUnlocked();
    return true;
  }

  private readonly handleVisibilityChange = () => {
    if (document.hidden) this.lock();
  };

  private setUnlocked(): void {
    if (!this._locked) return;
    this._locked = false;
    this._onDidChange.fire();
  }

  private async matchesRecoveryKeyHash(
    recoveryKey: string,
    expectedHash: string,
  ): Promise<boolean> {
    const trimmed = recoveryKey.trim();
    if (!trimmed) return false;
    return (await deriveRecoveryKeyHash(trimmed)) === expectedHash;
  }

  // 优先复用同步配置里已保存的 recoveryKeyHash，仅当只存明文 recoveryKey 时才现算，
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
