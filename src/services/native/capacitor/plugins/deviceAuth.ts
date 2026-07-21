import { registerPlugin } from '@capacitor/core';

export interface NativeDeviceAuthAuthenticateOptions {
  title: string;
  subtitle?: string;
  cancelLabel?: string;
}

interface NativeDeviceAuthPlugin {
  /** 设备是否可用系统身份验证（已录入生物识别或锁屏密码）。 */
  canAuthenticate(): Promise<{ available: boolean }>;
  /** 调起系统身份验证，用户取消或验证失败时 success 为 false。 */
  authenticate(options: NativeDeviceAuthAuthenticateOptions): Promise<{ success: boolean }>;
}

export const NativeDeviceAuth = registerPlugin<NativeDeviceAuthPlugin>('DeviceAuth');
