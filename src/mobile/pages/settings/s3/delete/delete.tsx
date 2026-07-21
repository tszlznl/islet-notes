import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { CloudSync } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IAppLockService } from '@/services/appLock/common/appLockService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { IHostService } from '@/services/native/common/hostService';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { Navigate } from 'react-router';

export function SettingsS3DeletePage() {
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const appLockService = useService(IAppLockService);
  const navigationService = useService(INavigationService);
  const showDialog = useDialog();
  const showSuccessToast = useSuccessToast();
  useWatchEvent(fileAssetService.onDidChangeConfig);
  const config = fileAssetService.getSyncConfig();
  const [backedUp, setBackedUp] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!config) return <Navigate to='/settings/s3' replace />;

  const recoveryKey = config.recoveryKey;

  const copyRecoveryKey = async () => {
    if (!recoveryKey) return;
    try {
      await hostService.writeToClipboard(recoveryKey);
      setCopied(true);
      showSuccessToast({
        message: localize('common.copied', 'Copied'),
        onDone: () => setCopied(false),
      });
    } catch {
      setCopied(false);
    }
  };

  const turnOffSync = async () => {
    // 身份验证依赖同步配置里的加密密码校验,锁开着时先引导去关锁,避免指纹与新同步密码脱节。
    if (appLockService.enabled) {
      showDialog({
        title: localize('settings.sync.turnOff', 'Turn off sync'),
        message: localize(
          'settings.sync.turnOff.appLockFirst',
          'Authentication is on and uses your database encryption password. Turn off authentication first, then turn off sync.',
        ),
        confirmLabel: localize('settings.sync.turnOff.goAppLock', 'Go to Authentication'),
        cancelLabel: localize('common.cancel', 'Cancel'),
        tone: 'primary',
        rootTestId: CloudSync.deleteAppLockDialog,
        confirmTestId: CloudSync.deleteAppLockConfirm,
        onConfirm: () => navigationService.navigate({ path: '/settings/authentication' }),
      });
      return;
    }
    await fileAssetService.clearSyncConfig();
  };

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={CloudSync.page}
      contentTestId={CloudSync.deleteConfirm}
      header={{ showBack: true, tone: 'surface' }}
    >
      <FormPage
        title={localize('settings.sync.turnOff', 'Turn off sync')}
        description={localize(
          'settings.sync.turnOff.desc',
          'After you turn off sync, this device stops syncing and its local sync settings are removed. Cloud data remains encrypted with the recovery key. Without a backup of the key, that data cannot be decrypted.',
        )}
        check={
          recoveryKey
            ? {
                label: localize(
                  'settings.sync.key.backedUp',
                  'I have safely backed up this recovery key',
                ),
                checked: backedUp,
                testId: CloudSync.deleteBackedUp,
                onChange: setBackedUp,
              }
            : undefined
        }
        actions={[
          {
            label: localize('settings.sync.turnOff', 'Turn off sync'),
            variant: 'warn',
            testId: CloudSync.deleteConfirmAction,
            disabled: !!recoveryKey && !backedUp,
            onClick: () => void turnOffSync(),
          },
        ]}
      >
        {recoveryKey && (
          <FormGroup title={localize('settings.sync.recoveryKey', 'Recovery key')}>
            <div className={styles.RecoveryKey.Row}>
              <code className={styles.RecoveryKey.Code} data-test-id={CloudSync.recoveryKeyValue}>
                {recoveryKey}
              </code>
              <button
                type='button'
                className={styles.Button.Icon}
                data-test-id={CloudSync.copyRecoveryKey}
                aria-label={localize('common.copy', 'Copy')}
                onClick={() => void copyRecoveryKey()}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </FormGroup>
        )}
      </FormPage>
    </HeaderLayoutPage>
  );
}
