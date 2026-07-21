import type {
  AttachmentRecord,
  MessageColor,
  CreateAttachmentEntryOptions,
  CreateTextEntryOptions,
  DiaryEntryRecord,
  DiaryModelData,
  IdentityMessagePosition,
  SyncConfigRecord,
} from '@/core/diary/type';
import { syncStoragePath } from '@/core/spec/syncStoragePath';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  ITestInjectionService,
  type TestInjectionRule,
} from '@/services/e2e/common/testInjectionService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { base64ToBlob } from '@/base/just-vibes/binary-codec';
import { readImageDimensions } from '@/base/just-vibes/browser-image-processing';
import { IHostService } from '@/services/native/common/hostService';
import { nanoid } from 'nanoid';
import { createDecorator } from 'vscf/platform/instantiation/common';

export interface E2eDriverTestInjectionApi {
  set(point: string, rule: TestInjectionRule): void;
  unset(point: string): void;
  clear(): void;
  list(): Record<string, TestInjectionRule>;
  initialRules?: Record<string, TestInjectionRule>;
}

export interface IE2eDriverService {
  readonly _serviceBrand: undefined;
  testInjection: E2eDriverTestInjectionApi;
  getDiaryModel(): Pick<
    DiaryModelData,
    'profile' | 'notebooks' | 'notebookOrder' | 'entries' | 'attachments' | 'identities'
  >;
  addNotebook(name: string): string;
  addIdentity(options: { name: string; messagePosition?: IdentityMessagePosition }): string;
  archiveIdentity(identityId: string): void;
  updateIdentityMessageColor(identityId: string, messageColor: MessageColor | undefined): void;
  updateProfileMessageColor(messageColor: MessageColor | undefined): void;
  addTextEntryWithOptions(options: CreateTextEntryOptions): string;
  addEntryForTest(entry: DiaryEntryRecord): string;
  addAttachmentEntry(options: CreateAttachmentEntryOptions): string;
  addAttachment(attachment: AttachmentRecord): void;
  setNotebookChatBackgroundForTest(
    notebookId: string,
    base64Image: string,
    mimeType: string,
  ): Promise<void>;
  saveSyncConfig(
    config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
  ): Promise<SyncConfigRecord | undefined>;
  clearSyncConfig(): Promise<void>;
  syncNow(): Promise<void>;
  readHostFileTree(path: string): Promise<string>;
}

export type IsletE2eGlobal = Partial<Omit<IE2eDriverService, 'testInjection'>> & {
  testInjection?: Partial<E2eDriverTestInjectionApi>;
};

declare global {
  var __ISLET_E2E__: IsletE2eGlobal | undefined;
}

export const IE2eDriverService = createDecorator<IE2eDriverService>('IE2eDriverService');

export class E2eDriverService implements IE2eDriverService {
  readonly _serviceBrand: undefined;

  readonly testInjection: E2eDriverTestInjectionApi = {
    set: (point, rule) => this.testInjectionService.set(point, rule),
    unset: (point) => this.testInjectionService.unset(point),
    clear: () => this.testInjectionService.clear(),
    list: () => this.testInjectionService.list(),
  };

  constructor(
    @IDiaryService private readonly diaryService: IDiaryService,
    @IFileAssetService private readonly fileAssetService: IFileAssetService,
    @IHostService private readonly hostService: IHostService,
    @ITestInjectionService private readonly testInjectionService: ITestInjectionService,
  ) {}

  getDiaryModel(): Pick<
    DiaryModelData,
    'profile' | 'notebooks' | 'notebookOrder' | 'entries' | 'attachments' | 'identities'
  > {
    const { profile, notebooks, notebookOrder, entries, attachments, identities } =
      this.diaryService.modelState;
    return {
      profile,
      notebooks,
      notebookOrder,
      entries,
      attachments,
      identities,
    };
  }

  addNotebook(name: string): string {
    return this.diaryService.addNotebook(name);
  }

  addIdentity(options: { name: string; messagePosition?: IdentityMessagePosition }): string {
    const identityId = this.diaryService.addIdentity(options.name);
    if (options.messagePosition) {
      this.diaryService.updateIdentityMessagePosition(identityId, options.messagePosition);
    }
    return identityId;
  }

  archiveIdentity(identityId: string): void {
    this.diaryService.archiveIdentity(identityId);
  }

  updateIdentityMessageColor(identityId: string, messageColor: MessageColor | undefined): void {
    this.diaryService.updateIdentityMessageColor(identityId, messageColor);
  }

  updateProfileMessageColor(messageColor: MessageColor | undefined): void {
    this.diaryService.updateProfileMessageColor(messageColor);
  }

  addTextEntryWithOptions(options: CreateTextEntryOptions): string {
    return this.diaryService.addTextEntryWithOptions(options);
  }

  addEntryForTest(entry: DiaryEntryRecord): string {
    return this.diaryService.addEntryForTest(entry);
  }

  addAttachmentEntry(options: CreateAttachmentEntryOptions): string {
    return this.diaryService.addAttachmentEntry(options);
  }

  addAttachment(attachment: AttachmentRecord): void {
    this.diaryService.addAttachment(attachment);
  }

  async setNotebookChatBackgroundForTest(
    notebookId: string,
    base64Image: string,
    mimeType: string,
  ): Promise<void> {
    const blob = base64ToBlob(base64Image, mimeType);
    const dimensions = await readImageDimensions(blob);
    const id = nanoid();
    const { s3Key } = syncStoragePath.image(id, mimeType);
    await this.hostService.writeAttachmentFile({
      scope: this.fileAssetService.getStorageScope(),
      key: s3Key,
      blob,
    });
    const attachment: AttachmentRecord = {
      id,
      notebookId,
      type: 'image',
      s3Key,
      mimeType,
      size: blob.size,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: Date.now(),
    };
    this.diaryService.addAttachment(attachment);
    this.diaryService.updateNotebookChatBackground(notebookId, attachment.id);
  }

  saveSyncConfig(
    config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
  ): Promise<SyncConfigRecord | undefined> {
    return this.fileAssetService.saveSyncConfig(config);
  }

  clearSyncConfig(): Promise<void> {
    return this.fileAssetService.clearSyncConfig();
  }

  syncNow(): Promise<void> {
    return this.diaryService.syncNow();
  }

  async readHostFileTree(path: string): Promise<string> {
    const contents: string[] = [];
    const visit = async (currentPath: string) => {
      const result = await this.hostService.readdir({ path: currentPath });
      for (const file of result.files) {
        const childPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        if (file.type === 'directory') {
          await visit(childPath);
          continue;
        }
        const content = await this.hostService.readFile({ path: childPath });
        contents.push(content.data);
      }
    };

    try {
      await visit(path);
    } catch {
      return '';
    }
    return contents.join('\n');
  }
}

export function installE2eDriverGlobal(driver: IE2eDriverService): void {
  const initialRules = globalThis.__ISLET_E2E__?.testInjection?.initialRules;
  if (initialRules) {
    for (const [point, rule] of Object.entries(initialRules)) {
      driver.testInjection.set(point, rule);
    }
  }
  globalThis.__ISLET_E2E__ = driver;
}
