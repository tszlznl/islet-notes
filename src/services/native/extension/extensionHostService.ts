import { BrowserHostService } from '@/services/native/browser/browserHostService';
import type {
  HostRequestOptions,
  HostResponse,
  HostFeature,
  HostRouterType,
} from '@/services/native/common/hostService';
import type { ITestInjectionService } from '@/services/e2e/common/testInjectionService';

declare global {
  interface Window {
    chrome?: ChromeExtensionApi;
  }
}

interface ChromeExtensionApi {
  runtime?: {
    id?: string;
  };
  permissions?: {
    contains(permissions: ChromePermissions): Promise<boolean>;
    request(permissions: ChromePermissions): Promise<boolean>;
  };
}

interface ChromePermissions {
  origins?: string[];
  permissions?: string[];
}

export class ExtensionHostService extends BrowserHostService {
  override readonly routerType: HostRouterType = 'hash';

  static isExtension(): boolean {
    return !!window.chrome?.runtime?.id;
  }

  constructor(useMemoryFilesystem = false, testInjectionService?: ITestInjectionService) {
    super(useMemoryFilesystem, testInjectionService);
  }

  override caniuse(feature: HostFeature): boolean {
    if (feature === 'webDavHttpRequest') return true;
    return super.caniuse(feature);
  }

  override async request(options: HostRequestOptions): Promise<HostResponse> {
    await requestOptionalHostPermission(options.url);

    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? base64ToBytes(options.body) : undefined,
    });

    return {
      status: response.status,
      body: bytesToBase64(new Uint8Array(await response.arrayBuffer())),
    };
  }
}

async function requestOptionalHostPermission(url: string): Promise<void> {
  const permissions = window.chrome?.permissions;
  if (!permissions) return;

  const origins = [toOriginPattern(url)];
  if (await permissions.contains({ origins })) return;
  if (await permissions.request({ origins })) return;

  throw new Error(`Permission denied for ${new URL(url).origin}`);
}

function toOriginPattern(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}/*`;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(offset, offset + 0x8000));
  }
  return btoa(binary);
}
