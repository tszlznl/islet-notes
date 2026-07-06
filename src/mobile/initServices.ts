import { IDiaryService } from '@/services/diary/common/diaryService';
import { WorkbenchDiaryService } from '@/services/diary/browser/workbenchDiaryService';
import { E2eDriverService, IE2eDriverService } from '@/services/e2e/common/e2eDriverService';
import {
  ITestInjectionService,
  TestInjectionService,
} from '@/services/e2e/common/testInjectionService';
import { FileAssetService, IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  INavigationService,
  NavigationService,
} from '@/services/navigationService/common/navigationService';
import { IHostService } from '@/services/native/common/hostService';
import { CapacitorNativeService } from '@/services/native/capacitor/capacitorNativeService';
import { BrowserHostService } from '@/services/native/browser/browserHostService';
import {
  IWorkbenchOverlayService,
  WorkbenchOverlayService,
} from '@/services/overlay/common/WorkbenchOverlayService';
import {
  getAppStorageScopeKey,
  SyncConfigSchema,
  SYNC_CONFIG_KEY,
} from '@/services/preferences/common/appPreferences';
import { ITrackService, TrackService } from '@/services/track/common/trackService';
import {
  ISpeechRecognitionService,
  SpeechRecognitionService,
} from '@/services/speechRecognition/common/speechRecognitionService';
import {
  InstantiationService,
  ServiceCollection,
  SyncDescriptor,
} from 'vscf/platform/instantiation/common';
import { isExperienceMode } from './utils/experienceMode';

export type StorageMode = 'persistent' | 'memory';

export interface InitServicesResult {
  instantiationService: InstantiationService;
  e2eDriverService: IE2eDriverService;
  testInjectionService: TestInjectionService;
}

export async function initServices(): Promise<InitServicesResult> {
  const mode = getDefaultStorageMode();
  const testInjectionService = new TestInjectionService();
  const hostService = createHostService(mode, testInjectionService);
  const initialSyncConfig =
    mode === 'memory' ? null : await hostService.getPreference(SYNC_CONFIG_KEY, SyncConfigSchema);
  const serviceCollection = new ServiceCollection();

  serviceCollection.set(IHostService, hostService);
  serviceCollection.set(INavigationService, new SyncDescriptor(NavigationService));
  serviceCollection.set(IWorkbenchOverlayService, new SyncDescriptor(WorkbenchOverlayService));
  serviceCollection.set(ITrackService, new SyncDescriptor(TrackService));
  serviceCollection.set(ISpeechRecognitionService, new SyncDescriptor(SpeechRecognitionService));
  serviceCollection.set(ITestInjectionService, testInjectionService);
  serviceCollection.set(IDiaryService, new SyncDescriptor(WorkbenchDiaryService));
  serviceCollection.set(
    IFileAssetService,
    new SyncDescriptor(FileAssetService, [initialSyncConfig]),
  );
  serviceCollection.set(IE2eDriverService, new SyncDescriptor(E2eDriverService));

  const instantiationService = new InstantiationService(serviceCollection, true);
  const services = instantiationService.invokeFunction((accessor) => {
    return {
      diaryService: accessor.get(IDiaryService),
      fileAssetService: accessor.get(IFileAssetService),
      speechRecognitionService: accessor.get(ISpeechRecognitionService),
      trackService: accessor.get(ITrackService),
      hostService: accessor.get(IHostService),
      e2eDriverService: accessor.get(IE2eDriverService),
    };
  });

  services.trackService.start();

  const storageScopeKey = await getAppStorageScopeKey(mode, initialSyncConfig ?? undefined);
  await services.fileAssetService.start(storageScopeKey);
  await services.diaryService.initStorageScope(storageScopeKey);

  return {
    instantiationService,
    e2eDriverService: services.e2eDriverService,
    testInjectionService,
  };
}

function getDefaultStorageMode(): StorageMode {
  return isExperienceMode() ? 'memory' : 'persistent';
}

function createHostService(mode: StorageMode, testInjectionService: TestInjectionService) {
  if (CapacitorNativeService.isNative()) {
    return new CapacitorNativeService(mode === 'memory', testInjectionService);
  }
  return new BrowserHostService(mode === 'memory', testInjectionService);
}
