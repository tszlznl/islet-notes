import type { SyncConfigRecord } from '@/core/diary/type';
import {
  createFileAssetObjectStore,
  type FileAssetObjectStore,
} from '@/base/just-vibes/file-asset-object-store';
import type { IHostService } from '@/services/native/common/hostService';
import {
  createSyncConfigPreference,
  SyncConfigPreference,
} from '@/services/preferences/common/appPreferences';

export class FileAssetObjectStoreController {
  private objectStore: FileAssetObjectStore;
  private readonly syncConfigEnabled: boolean;
  private syncConfig: SyncConfigRecord | undefined;

  constructor(
    initialSyncConfig: SyncConfigRecord | null | undefined,
    private readonly hostService: IHostService,
    private readonly onDidChangeConfig: () => void,
  ) {
    this.syncConfigEnabled = initialSyncConfig !== null;
    this.syncConfig = initialSyncConfig ?? undefined;
    this.objectStore = createFileAssetObjectStore(this.syncConfig, hostService);
  }

  getSyncConfig(): SyncConfigRecord | undefined {
    return this.syncConfig;
  }

  getObjectStore(): FileAssetObjectStore {
    return this.objectStore;
  }

  async saveSyncConfig(
    config: Omit<SyncConfigRecord, 'updatedAt'> | SyncConfigRecord,
  ): Promise<SyncConfigRecord | undefined> {
    if (!this.syncConfigEnabled) return undefined;
    const nextConfig = createSyncConfigPreference(config);
    this.syncConfig = await this.hostService.savePreference(SyncConfigPreference, nextConfig);
    this.objectStore = createFileAssetObjectStore(this.syncConfig, this.hostService);
    this.onDidChangeConfig();
    return this.syncConfig;
  }

  async clearSyncConfig(): Promise<void> {
    if (!this.syncConfigEnabled) return;
    await this.hostService.clearPreference(SyncConfigPreference);
    this.syncConfig = undefined;
    this.objectStore = createFileAssetObjectStore(this.syncConfig, this.hostService);
    this.onDidChangeConfig();
  }
}
