import { AppLockConfigPreference } from '@/services/appLock/common/appLockConfig';
import { IdentityConfigPreference } from '@/services/diary/common/identityConfig';
import { MembershipPurchasedCachePreference } from '@/services/membership/common/membershipService';
import type { IHostService } from '@/services/native/common/hostService';
import {
  CalendarDisplayOrderPreference,
  MessageLinkDetectionPreference,
  PageTransitionPreference,
  SyncConfigPreference,
} from '@/services/preferences/common/appPreferences';
import { SpeechRecognitionConfigPreference } from '@/services/speechRecognition/common/speechRecognitionConfig';

const hostPreferences = [
  AppLockConfigPreference,
  SyncConfigPreference,
  IdentityConfigPreference,
  CalendarDisplayOrderPreference,
  MessageLinkDetectionPreference,
  PageTransitionPreference,
  SpeechRecognitionConfigPreference,
  MembershipPurchasedCachePreference,
] as const;

/** 渲染应用前加载全部 Host 偏好，保证业务读取只访问同步内存缓存。 */
export async function loadPreferences(hostService: IHostService): Promise<void> {
  await hostService.loadPreferences(hostPreferences);
}
