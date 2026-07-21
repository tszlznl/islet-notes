import { APP_VERSION, PROJECT_COMMIT_HASH } from '@/base/common/version';
import { localize } from '@/nls';
import type { SyncConfigRecord } from '@/core/diary/type';
import { CellListGroup } from '@/mobile/components/CellList';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { exitExperienceMode, isExperienceMode } from '@/mobile/utils/experienceMode';
import { Settings } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React from 'react';
import { clearExperienceSeedMarker, writeExperienceTestData } from './experienceSeedData';

export function SettingsPage() {
  const navigationService = useService(INavigationService);
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const showDialog = useDialog();
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const experienceMode = isExperienceMode();
  // 会员依赖云同步身份（recovery key）：未配置同步时隐藏入口，避免进入后是禁用购买的死胡同页。
  const hasCloudSync = hasRecoveryKey(fileAssetService.getSyncConfig());
  const showMembership = !experienceMode && hostService.platform !== 'ios' && hasCloudSync;

  const seedExperienceData = async () => {
    const loadingToast = showLoadingToast({
      message: localize('settings.experience.seedWriting', 'Adding sample data...'),
    });
    try {
      const added = await writeExperienceTestData(diaryService, fileAssetService);
      showSuccessToast({
        message: added
          ? localize('settings.experience.seedDone', 'Sample data added')
          : localize('settings.experience.seedExists', 'Sample data already exists'),
      });
    } catch {
      showSuccessToast({
        message: localize('settings.experience.seedFailed', 'Could not add sample data'),
      });
    } finally {
      loadingToast.dispose();
    }
  };

  return (
    <HeaderPage
      pageTestId={Settings.preferencesPage}
      contentTestId={Settings.preferencesContent}
      header={{ title: localize('settings.title', 'Settings'), showBack: true }}
    >
      <CellListGroup
        items={[
          {
            hide: experienceMode,
            label: localize('settings.s3', 'Cloud Sync'),
            testId: Settings.s3,
            onClick: () => navigationService.navigate({ path: '/settings/s3' }),
          },
          {
            hide: !showMembership,
            label: localize('settings.membership', 'Membership'),
            testId: Settings.membership,
            onClick: () => navigationService.navigate({ path: '/settings/membership' }),
          },
          {
            label: localize('settings.import.title', 'Import'),
            testId: Settings.import,
            onClick: () => navigationService.navigate({ path: '/settings/import' }),
          },
          {
            label: localize('settings.language', 'Language'),
            right: { type: 'value', text: globalThis.language },
            testId: Settings.language,
            onClick: () => navigationService.navigate({ path: '/settings/language' }),
          },
          {
            label: localize('settings.theme', 'Theme'),
            testId: Settings.theme,
            onClick: () => navigationService.navigate({ path: '/settings/theme' }),
          },
          {
            label: localize('settings.version', 'Version'),
            right: { type: 'value', text: `${APP_VERSION} ${PROJECT_COMMIT_HASH.slice(0, 7)}` },
            testId: Settings.version,
          },
        ]}
      />
      <CellListGroup
        className={styles.Common.SectionGap}
        items={[
          {
            label: localize('settings.aiConfig', 'AI settings'),
            testId: Settings.ai,
            onClick: () => navigationService.navigate({ path: '/settings/ai' }),
          },
        ]}
      />
      {experienceMode && (
        <CellListGroup
          className={styles.Common.SectionGap}
          items={[
            {
              type: 'action',
              danger: true,
              label: localize('settings.experience.exit', 'Exit experience mode'),
              testId: Settings.exitExperience,
              onClick: () =>
                showDialog({
                  message: localize(
                    'settings.experience.exitConfirm',
                    'Exit experience mode? Data from this session will be cleared.',
                  ),
                  confirmLabel: localize('settings.experience.exitAction', 'Exit experience mode'),
                  cancelLabel: localize('common.cancel', 'Cancel'),
                  rootTestId: Settings.exitExperienceDialog,
                  confirmTestId: Settings.exitExperienceConfirm,
                  cancelTestId: Settings.exitExperienceCancel,
                  onConfirm: () => {
                    clearExperienceSeedMarker();
                    exitExperienceMode();
                  },
                }),
            },
            {
              type: 'action',
              label: localize('settings.experience.seedData', 'Add sample data'),
              testId: Settings.seedExperienceData,
              onClick: seedExperienceData,
            },
          ]}
        />
      )}
    </HeaderPage>
  );
}

function hasRecoveryKey(config: SyncConfigRecord | undefined): boolean {
  return Boolean(config?.recoveryKeyHash?.trim() || config?.recoveryKey?.trim());
}
