// @islet-import-scope same-dir

import type { WebDAVConfigRecord } from '@/core/diary/type';
import { syncStoragePath } from '@/core/spec/syncStoragePath';
import type {
  ObjectStorage,
  ObjectStorageDownloadRequest,
  ObjectStorageHostBridge,
  ObjectStorageObjectMetadata,
  ObjectStoragePutOptions,
} from './objectStorage';

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
}

export type WebDAVConnectionConfig = Pick<WebDAVConfigRecord, 'url' | 'username' | 'password'>;

const PROPFIND_BODY = [
  '<?xml version="1.0" encoding="utf-8" ?>',
  '<D:propfind xmlns:D="DAV:">',
  '<D:prop><D:getetag/><D:getcontentlength/><D:getlastmodified/></D:prop>',
  '</D:propfind>',
].join('');

export function createWebDAVObjectStorage(
  config: WebDAVConnectionConfig,
  hostService?: ObjectStorageHostBridge,
): ObjectStorage {
  return new WebDAVObjectStorage(config, hostService);
}

export async function testWebDAVConnection(
  config: WebDAVConnectionConfig & Pick<WebDAVConfigRecord, 'prefix'>,
  hostService?: ObjectStorageHostBridge,
): Promise<TestConnectionResult> {
  try {
    const storage = createWebDAVObjectStorage(config, hostService);
    const key = syncStoragePath.remote.healthcheck(config);
    await storage.putObject(key, JSON.stringify({ ok: true, at: new Date().toISOString() }), {
      contentType: 'application/json',
    });
    const payload = await storage.getObjectBytes(key);
    if (!payload) throw new Error('Healthcheck file is missing after upload.');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

class WebDAVObjectStorage implements ObjectStorage {
  private readonly baseUrl: string;

  constructor(
    private readonly config: WebDAVConnectionConfig,
    private readonly hostService: ObjectStorageHostBridge | undefined,
  ) {
    this.baseUrl = config.url.trim().replace(/\/+$/, '');
  }

  async putObject(
    key: string,
    body: Blob | Uint8Array | string,
    options: ObjectStoragePutOptions = {},
  ): Promise<void> {
    const payload = toRequestBody(body, options.contentType);
    let response = await this.request('PUT', key, {
      body: payload,
      contentType: options.contentType,
    });
    if (isMissingCollectionStatus(response.status)) {
      await this.ensureParentCollections(key);
      response = await this.request('PUT', key, {
        body: payload,
        contentType: options.contentType,
      });
    }
    if (!response.ok) {
      throw new Error(`PUT ${key} failed with ${response.status}`);
    }
  }

  async getObjectBytes(key: string): Promise<Uint8Array | undefined> {
    const blob = await this.getObjectBlob(key);
    return blob ? new Uint8Array(await blob.arrayBuffer()) : undefined;
  }

  // Signed-URL options from ObjectStorageGetOptions do not apply to WebDAV.
  async getObjectBlob(key: string): Promise<Blob | undefined> {
    const { url, headers } = this.buildGetRequest(key);
    const response = await this.requestUrl('GET', url, { headers });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`GET ${key} failed with ${response.status}`);
    return response.blob();
  }

  async headObject(key: string): Promise<ObjectStorageObjectMetadata | undefined> {
    const response = await this.request('PROPFIND', key, {
      body: PROPFIND_BODY,
      contentType: 'application/xml; charset=utf-8',
      headers: { Depth: '0' },
    });
    if (response.status === 404) return undefined;
    if (!response.ok && response.status !== 207) {
      throw new Error(`PROPFIND ${key} failed with ${response.status}`);
    }
    return parsePropfindMetadata(await response.text());
  }

  private async ensureParentCollections(key: string): Promise<void> {
    const segments = key.replace(/^\/+/, '').split('/').slice(0, -1);
    let collection = '';
    for (const segment of segments) {
      collection = collection ? `${collection}/${segment}` : segment;
      const response = await this.request('MKCOL', collection);
      // 405 (and 301 from servers that redirect collection URLs) means the directory already exists.
      if (!response.ok && response.status !== 405 && response.status !== 301) {
        throw new Error(`MKCOL ${collection} failed with ${response.status}`);
      }
    }
  }

  private async request(
    method: string,
    key: string,
    options: { body?: Blob | string; contentType?: string; headers?: Record<string, string> } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { ...options.headers };
    if (options.contentType) headers['Content-Type'] = options.contentType;
    const url = this.buildResourceUrl(key);
    return this.requestUrl(method, url, {
      body: options.body,
      headers,
    });
  }

  private async requestUrl(
    method: string,
    url: string,
    options: { body?: Blob | string; headers?: Record<string, string> } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { ...options.headers };
    const credentials = buildBasicAuth(this.config);
    if (credentials) headers.Authorization = credentials;
    // Native WebViews enforce CORS and Android's HTTP stack rejects the
    // non-standard MKCOL/PROPFIND methods, so native platforms use this
    // binary-safe OkHttp/URLSession bridge instead of fetch.
    if (this.hostService?.caniuse('webDavHttpRequest')) {
      const result = await this.hostService.request({
        url,
        method,
        headers,
        body: options.body === undefined ? undefined : await bodyToBase64(options.body),
      });
      if (result) {
        return base64ToResponse(result.status, result.body);
      }
    }
    return fetch(url, {
      method,
      headers,
      body: options.body,
    });
  }

  private buildGetRequest(key: string): ObjectStorageDownloadRequest {
    const headers: Record<string, string> = {};
    const credentials = buildBasicAuth(this.config);
    if (credentials) headers.Authorization = credentials;
    return {
      url: this.buildResourceUrl(key),
      method: 'GET',
      headers,
    };
  }

  private buildResourceUrl(key: string): string {
    const encodedPath = key
      .replace(/^\/+/, '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${this.baseUrl}/${encodedPath}`;
  }
}

function isMissingCollectionStatus(status: number): boolean {
  return status === 404 || status === 409 || status === 403;
}

function buildBasicAuth(config: WebDAVConnectionConfig): string | undefined {
  const username = config.username.trim();
  if (!username) return undefined;
  return `Basic ${btoa(`${username}:${config.password}`)}`;
}

function toRequestBody(body: Blob | Uint8Array | string, contentType?: string): Blob | string {
  if (body instanceof Uint8Array) {
    const copy = new Uint8Array(body.byteLength);
    copy.set(body);
    return new Blob([copy.buffer], { type: contentType ?? 'application/octet-stream' });
  }
  return body;
}

async function bodyToBase64(body: Blob | string): Promise<string> {
  const bytes =
    typeof body === 'string'
      ? new TextEncoder().encode(body)
      : new Uint8Array(await body.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToResponse(status: number, body: string): Response {
  const binary = atob(body || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const withoutBody = bytes.byteLength === 0 || status === 204 || status === 205 || status === 304;
  return new Response(withoutBody ? null : bytes.buffer, { status });
}

function parsePropfindMetadata(xml: string): ObjectStorageObjectMetadata {
  const eTag = readPropfindValue(xml, 'getetag');
  const lastModifiedText = readPropfindValue(xml, 'getlastmodified');
  const contentLengthText = readPropfindValue(xml, 'getcontentlength');
  const lastModified = lastModifiedText ? new Date(lastModifiedText) : undefined;
  const contentLength = contentLengthText ? Number(contentLengthText) : undefined;
  return {
    // Fall back to a synthetic change marker so sync state checks still work
    // against servers that do not expose getetag.
    eTag: eTag ?? buildFallbackETag(lastModified, contentLength),
    lastModified: lastModified && !Number.isNaN(lastModified.getTime()) ? lastModified : undefined,
    contentLength:
      contentLength !== undefined && Number.isFinite(contentLength) ? contentLength : undefined,
  };
}

function buildFallbackETag(
  lastModified: Date | undefined,
  contentLength: number | undefined,
): string | undefined {
  if (!lastModified || Number.isNaN(lastModified.getTime())) return undefined;
  return `W/"${lastModified.getTime()}-${contentLength ?? 0}"`;
}

function readPropfindValue(xml: string, property: string): string | undefined {
  const match = new RegExp(`<[^>]*${property}[^>]*>([^<]*)<`, 'i').exec(xml);
  const value = match?.[1]?.trim();
  return value ? decodeXmlEntities(value) : undefined;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
