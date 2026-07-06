import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from '@/base/just-vibes/binary-codec';
import { IHostService } from '@/services/native/common/hostService';
import type { SpeechRecognitionCredentials } from '@/services/speechRecognition/common/speechRecognitionConfig';
import { Capacitor } from '@capacitor/core';

// 百度短语音两个域名：鉴权(aip) 与识别(vop)。
const BAIDU_AIP_HOST = 'https://aip.baidubce.com';
const BAIDU_VOP_HOST = 'https://vop.baidu.com';
// 极速版输入法模型，固定 16k 采样率、单声道。
// 百度短语音识别极速版，中英文混合。
const BAIDU_DEV_PID = 80001;
const BAIDU_RATE = 16000;
const BAIDU_CUID = 'islet-voice';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

type BaiduHost = 'aip' | 'vop';
type BaiduAudioFormat = 'pcm' | 'amr' | 'm4a' | 'wav';

interface BaiduAudioPayload {
  bytes: Uint8Array;
  format: BaiduAudioFormat;
  rate: number;
}

export class BaiduSpeechRecognitionProvider {
  private tokenCache:
    | { apiKey: string; secretKey: string; token: string; expiresAt: number }
    | undefined;

  constructor(private readonly hostService: IHostService) {}

  async testConfig(config: SpeechRecognitionCredentials): Promise<void> {
    const { apiKey, secretKey } = normalizeCredentials(config);
    await requestBaiduToken(this.hostService, apiKey, secretKey);
  }

  async transcribe(blob: Blob, config: SpeechRecognitionCredentials): Promise<string> {
    const { apiKey, secretKey } = normalizeCredentials(config);
    const token = await this.ensureToken(apiKey, secretKey);
    const audio = await prepareBaiduAudio(blob);
    const url = buildBaiduUrl(
      'vop',
      `/pro_api?dev_pid=${BAIDU_DEV_PID}&cuid=${encodeURIComponent(
        BAIDU_CUID,
      )}&token=${encodeURIComponent(token)}`,
    );
    const response = await baiduRequest(this.hostService, url, {
      method: 'POST',
      headers: { 'Content-Type': `audio/${audio.format};rate=${audio.rate}` },
      body: audio.bytes,
    });
    if (!response.ok) {
      throw new Error(`Speech recognition failed: ${response.status}`);
    }
    const payload = await response.json();
    if (payload?.err_no && payload.err_no !== 0) {
      throw new Error(
        `Speech recognition failed: ${payload.err_no} ${payload.err_msg ?? ''}`.trim(),
      );
    }
    const result = Array.isArray(payload?.result) ? payload.result[0] : undefined;
    return String(result ?? '').trim();
  }

  private async ensureToken(apiKey: string, secretKey: string): Promise<string> {
    if (
      this.tokenCache &&
      this.tokenCache.apiKey === apiKey &&
      this.tokenCache.secretKey === secretKey &&
      this.tokenCache.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS
    ) {
      return this.tokenCache.token;
    }
    const { token, expiresIn } = await requestBaiduToken(this.hostService, apiKey, secretKey);
    this.tokenCache = {
      apiKey,
      secretKey,
      token,
      expiresAt: Date.now() + Math.max(0, expiresIn) * 1000,
    };
    return token;
  }
}

function normalizeCredentials(config: SpeechRecognitionCredentials): SpeechRecognitionCredentials {
  const apiKey = config.apiKey.trim();
  const secretKey = config.secretKey.trim();
  if (!apiKey || !secretKey) {
    throw new Error('Baidu API Key and Secret Key are required.');
  }
  return { apiKey, secretKey };
}

// Web（本地开发）走 Vite 反向代理 `/api/baidu/*`；原生端直连百度域名并经 hostService.request 桥接。
function buildBaiduUrl(host: BaiduHost, pathWithQuery: string): string {
  if (!Capacitor.isNativePlatform()) {
    return `/api/baidu/${host}${pathWithQuery}`;
  }
  return `${host === 'aip' ? BAIDU_AIP_HOST : BAIDU_VOP_HOST}${pathWithQuery}`;
}

async function baiduRequest(
  hostService: IHostService,
  url: string,
  init: { method: string; headers?: Record<string, string>; body?: Uint8Array },
): Promise<Response> {
  if (!Capacitor.isNativePlatform()) {
    return fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body ? bytesToArrayBuffer(init.body) : undefined,
    });
  }
  const result = await hostService.request({
    url,
    method: init.method,
    headers: init.headers ?? {},
    body: init.body ? bytesToBase64(init.body) : undefined,
  });
  const bytes = base64ToBytes(result.body);
  const empty = bytes.byteLength === 0 || result.status === 204 || result.status === 304;
  return new Response(empty ? null : bytesToArrayBuffer(bytes), { status: result.status });
}

async function prepareBaiduAudio(blob: Blob): Promise<BaiduAudioPayload> {
  const directFormat = baiduDirectAudioFormat(blob.type);
  if (directFormat === 'pcm' || directFormat === 'amr') {
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      format: directFormat,
      rate: BAIDU_RATE,
    };
  }

  try {
    return {
      bytes: await transcodeAudioToPcm(blob),
      format: 'pcm',
      rate: BAIDU_RATE,
    };
  } catch (error) {
    if (directFormat) {
      return {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        format: directFormat,
        rate: BAIDU_RATE,
      };
    }
    throw error instanceof Error
      ? error
      : new Error('Speech recognition audio format is not supported.');
  }
}

async function transcodeAudioToPcm(blob: Blob): Promise<Uint8Array> {
  const audioBuffer = await decodeAudioBlob(blob);
  const pcmBuffer = await renderMonoPcmBuffer(audioBuffer, BAIDU_RATE);
  return encodePcm16LittleEndian(pcmBuffer.getChannelData(0));
}

type WebkitAudioGlobal = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
  webkitOfflineAudioContext?: typeof OfflineAudioContext;
};

async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const audioGlobal = globalThis as WebkitAudioGlobal;
  const AudioContextCtor = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('Speech recognition audio decoding is not supported.');
  }

  const context = new AudioContextCtor();
  try {
    return await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function renderMonoPcmBuffer(
  sourceBuffer: AudioBuffer,
  sampleRate: number,
): Promise<AudioBuffer> {
  const audioGlobal = globalThis as WebkitAudioGlobal;
  const OfflineAudioContextCtor =
    audioGlobal.OfflineAudioContext ?? audioGlobal.webkitOfflineAudioContext;
  if (!OfflineAudioContextCtor) {
    throw new Error('Speech recognition audio resampling is not supported.');
  }

  const frameCount = Math.max(1, Math.ceil(sourceBuffer.duration * sampleRate));
  const context = new OfflineAudioContextCtor(1, frameCount, sampleRate);
  const source = context.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(context.destination);
  source.start(0);
  return context.startRendering();
}

function encodePcm16LittleEndian(samples: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

async function requestBaiduToken(
  hostService: IHostService,
  apiKey: string,
  secretKey: string,
): Promise<{ token: string; expiresIn: number }> {
  const url = buildBaiduUrl(
    'aip',
    `/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(
      apiKey,
    )}&client_secret=${encodeURIComponent(secretKey)}`,
  );
  const response = await baiduRequest(hostService, url, { method: 'POST', body: new Uint8Array() });
  if (!response.ok) {
    throw new Error(`Baidu authorization failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.access_token) {
    throw new Error(String(payload?.error_description ?? 'Baidu authorization failed.'));
  }
  return { token: String(payload.access_token), expiresIn: Number(payload.expires_in ?? 0) };
}

function baiduDirectAudioFormat(mimeType: string): BaiduAudioFormat | undefined {
  const type = mimeType.split(';')[0].trim().toLowerCase();
  if (type === 'audio/pcm' || type === 'audio/l16') return 'pcm';
  if (type === 'audio/amr') return 'amr';
  if (type === 'audio/m4a' || type === 'audio/mp4' || type === 'audio/aac') return 'm4a';
  if (type === 'audio/wav' || type === 'audio/wave' || type === 'audio/x-wav') return 'wav';
  return undefined;
}
