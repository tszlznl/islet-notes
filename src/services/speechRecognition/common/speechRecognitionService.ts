import type { AudioAttachmentRecord } from '@/core/diary/type';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import { BaiduSpeechRecognitionProvider } from '@/services/speechRecognition/common/baiduSpeechRecognitionProvider';
import {
  SpeechRecognitionConfigPreference,
  type SpeechRecognitionCredentials,
} from '@/services/speechRecognition/common/speechRecognitionConfig';
import { Emitter, Event } from 'vscf/base/common/event';
import { createDecorator } from 'vscf/platform/instantiation/common';

export interface ISpeechRecognitionService {
  readonly _serviceBrand: undefined;
  readonly onDidChangeTranscribing: Event<void>;
  testConfig(config: SpeechRecognitionCredentials): Promise<void>;
  /**
   * 用 entry 及其音频附件触发(或重试)识别:自行拉取音频 → 识别 → 写回 entry.text,
   * 识别中状态按 entryId 维护在内存,供消息气泡展示 loading。
   */
  recognize(entryId: string, attachment: AudioAttachmentRecord): void;
  isTranscribing(entryId: string): boolean;
  getTranscribingVersion(): number;
}

export const ISpeechRecognitionService = createDecorator<ISpeechRecognitionService>(
  'ISpeechRecognitionService',
);

export class SpeechRecognitionService implements ISpeechRecognitionService {
  readonly _serviceBrand: undefined;
  private readonly _onDidChangeTranscribing = new Emitter<void>();
  readonly onDidChangeTranscribing = this._onDidChangeTranscribing.event;
  private readonly baiduProvider: BaiduSpeechRecognitionProvider;
  private readonly transcribingEntries = new Set<string>();
  private transcribingVersion = 0;

  constructor(
    @IHostService private readonly hostService: IHostService,
    @IFileAssetService private readonly fileAssetService: IFileAssetService,
    @IDiaryService private readonly diaryService: IDiaryService,
  ) {
    this.baiduProvider = new BaiduSpeechRecognitionProvider(hostService);
  }

  isTranscribing(entryId: string): boolean {
    return this.transcribingEntries.has(entryId);
  }

  getTranscribingVersion(): number {
    return this.transcribingVersion;
  }

  async testConfig(config: SpeechRecognitionCredentials): Promise<void> {
    await this.baiduProvider.testConfig(config);
  }

  recognize(entryId: string, attachment: AudioAttachmentRecord): void {
    if (this.transcribingEntries.has(entryId)) return;
    void this.runRecognition(entryId, attachment);
  }

  private async runRecognition(entryId: string, attachment: AudioAttachmentRecord): Promise<void> {
    this.setTranscribing(entryId, true);
    try {
      const credentials = await this.loadCredentials();
      const blob = await this.loadAudio(attachment);
      const text = (await this.baiduProvider.transcribe(blob, credentials)).trim();
      if (text) this.diaryService.updateAttachmentEntryText(entryId, text);
    } catch {
      // 识别失败保持原状,状态在 finally 清除,用户可长按重试。
    } finally {
      this.setTranscribing(entryId, false);
    }
  }

  private async loadCredentials(): Promise<SpeechRecognitionCredentials> {
    const config = this.hostService.getPreference(SpeechRecognitionConfigPreference);
    const apiKey = config?.apiKey.trim();
    const secretKey = config?.secretKey.trim();
    if (!apiKey || !secretKey) {
      throw new Error('Speech recognition is not configured.');
    }
    return { apiKey, secretKey };
  }

  private async loadAudio(attachment: AudioAttachmentRecord): Promise<Blob> {
    if (!attachment.s3Key) throw new Error('Audio is missing.');
    const url = await this.fileAssetService.getFileUrl(attachment.s3Key, { role: 'thumbnail' });
    if (!url) throw new Error('Failed to load audio.');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load audio.');
    return response.blob();
  }

  private setTranscribing(entryId: string, active: boolean): void {
    if (this.transcribingEntries.has(entryId) === active) return;
    if (active) this.transcribingEntries.add(entryId);
    else this.transcribingEntries.delete(entryId);
    this.transcribingVersion += 1;
    this._onDidChangeTranscribing.fire();
  }
}
