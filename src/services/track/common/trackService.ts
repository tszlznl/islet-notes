import { APP_VERSION } from '@/base/common/version';
import { getAnalyticsRoutePath } from '@/mobile/route';
import { IHostService } from '@/services/native/common/hostService';
import { createDecorator } from 'vscf/platform/instantiation/common';

const ANALYTICS_SCRIPT_ID = 'islet-native-analytics';
const ANALYTICS_SCRIPT_SRC = 'https://u.hamsterbase.com/script.js';
const ANALYTICS_WEBSITE_ID = 'd9bfc9e1-1e97-4b80-9cc9-482da58e162e';
const ANALYTICS_BEFORE_SEND = '__isletAnalyticsBeforeSend';
const ANALYTICS_APP_VERSION_KEY = 'app_version';

export interface ITrackService {
  readonly _serviceBrand: undefined;
  start(): void;
  trackEvent(eventName: string, eventData?: Record<string, unknown>): void;
}

export class TrackService implements ITrackService {
  public readonly _serviceBrand: undefined;

  constructor(@IHostService private readonly hostService: IHostService) {}

  start(): void {
    if (!this.hostService.isNative) return;
    if (document.getElementById(ANALYTICS_SCRIPT_ID)) return;

    //@ts-ignore
    window[ANALYTICS_BEFORE_SEND] = normalizeAnalyticsPayload;

    const script = document.createElement('script');
    script.id = ANALYTICS_SCRIPT_ID;
    script.defer = true;
    script.src = ANALYTICS_SCRIPT_SRC;
    script.dataset.websiteId = ANALYTICS_WEBSITE_ID;
    script.dataset.beforeSend = ANALYTICS_BEFORE_SEND;
    document.head.append(script);
  }

  trackEvent(eventName: string, eventData?: Record<string, unknown>): void {
    if (!this.hostService.isNative) return;
    //@ts-ignore
    window.umami?.track(eventName, withAppVersion(eventData));
  }
}

export const ITrackService = createDecorator<ITrackService>('ITrackService');

function normalizeAnalyticsPayload(
  _type: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const pathname = getPayloadPathname(payload.url);
  return {
    ...payload,
    url: getAnalyticsRoutePath(pathname),
    data: withAppVersion(getPayloadData(payload.data)),
  };
}

function withAppVersion(data?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...data,
    [ANALYTICS_APP_VERSION_KEY]: APP_VERSION,
  };
}

function getPayloadData(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  return data as Record<string, unknown>;
}

function getPayloadPathname(url: unknown): string {
  if (typeof url !== 'string') return window.location.pathname;

  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return window.location.pathname;
  }
}
