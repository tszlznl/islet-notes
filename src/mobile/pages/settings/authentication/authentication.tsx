import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { useMembershipStatus } from '@/mobile/hooks/useMembershipStatus';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { cx, styles } from '@/mobile/styles/ui';
import { AppLockSettings } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IAppLockService } from '@/services/appLock/common/appLockService';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { IHostService } from '@/services/native/common/hostService';
import React, { useEffect, useState } from 'react';

export function SettingsAuthenticationPage() {
  const hostService = useService(IHostService);
  const fileAssetService = useService(IFileAssetService);
  const appLockService = useService(IAppLockService);
  const navigationService = useService(INavigationService);
  const showDialog = useDialog();
  const showSuccessToast = useSuccessToast();
  useWatchEvent(appLockService.onDidChange);

  const {
    status: membershipStatus,
    data: resolvedMembershipStatus,
    isLoading: membershipLoading,
  } = useMembershipStatus();
  const membershipStatusPending = membershipLoading || !resolvedMembershipStatus;

  const [deviceAuthAvailable, setDeviceAuthAvailable] = useState<boolean>();
  useEffect(() => {
    let disposed = false;
    void hostService.canUseDeviceAuth().then((available) => {
      if (!disposed) setDeviceAuthAvailable(available);
    });
    return () => {
      disposed = true;
    };
  }, [hostService]);

  const [showEnableForm, setShowEnableForm] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [keyError, setKeyError] = useState<string>();
  const [verifying, setVerifying] = useState(false);

  const enabled = appLockService.enabled;
  const syncConfig = fileAssetService.getSyncConfig();
  const hasRecoveryKey = Boolean(
    syncConfig?.recoveryKeyHash?.trim() || syncConfig?.recoveryKey?.trim(),
  );

  const closeEnableForm = () => {
    setShowEnableForm(false);
    setRecoveryKey('');
    setKeyError(undefined);
  };

  const handleToggle = (checked: boolean) => {
    if (checked === enabled) return;
    if (!checked) {
      showDialog({
        title: localize('appLock.title', 'Authentication'),
        message: localize('appLock.disableConfirm', 'Turn off authentication?'),
        confirmLabel: localize('appLock.disableAction', 'Turn off'),
        cancelLabel: localize('common.cancel', 'Cancel'),
        rootTestId: AppLockSettings.disableDialog,
        confirmTestId: AppLockSettings.disableConfirm,
        onConfirm: () => void appLockService.disable(),
      });
      return;
    }
    // 先确认有可校验的加密密码（云同步），再确认会员，最后进入密码验证。
    if (!hasRecoveryKey) {
      showDialog({
        title: localize('appLock.title', 'Authentication'),
        message: localize(
          'appLock.needSync',
          'Authentication verifies your database encryption password. Set up cloud sync first.',
        ),
        confirmLabel: localize('appLock.goSync', 'Set up cloud sync'),
        cancelLabel: localize('common.cancel', 'Cancel'),
        tone: 'primary',
        rootTestId: AppLockSettings.noSyncDialog,
        onConfirm: () => navigationService.navigate({ path: '/settings/s3' }),
      });
      return;
    }
    if (membershipStatusPending) return;
    if (!membershipStatus.active) {
      showDialog({
        title: localize('appLock.title', 'Authentication'),
        message: localize(
          'appLock.memberOnly',
          'Authentication is a membership feature. Get a membership to enable it.',
        ),
        confirmLabel: localize('appLock.goPurchase', 'Get membership'),
        cancelLabel: localize('common.cancel', 'Cancel'),
        tone: 'primary',
        rootTestId: AppLockSettings.memberOnlyDialog,
        onConfirm: () => navigationService.navigate({ path: '/settings/membership' }),
      });
      return;
    }
    setShowEnableForm(true);
  };

  const confirmEnable = async () => {
    if (verifying) return;
    setVerifying(true);
    const result = await appLockService.enable(recoveryKey).finally(() => setVerifying(false));
    if (result.ok) {
      closeEnableForm();
      showSuccessToast({ message: localize('appLock.enabled', 'Authentication is on') });
      return;
    }
    setKeyError(
      result.error === 'no-recovery-key'
        ? localize('appLock.enable.noSync', 'Cloud sync is not set up.')
        : localize('appLock.enable.wrongKey', 'Incorrect password. Try again.'),
    );
  };

  return (
    <HeaderPage
      pageTestId={AppLockSettings.page}
      contentTestId={AppLockSettings.content}
      header={{ title: localize('appLock.title', 'Authentication'), showBack: true }}
    >
      <div>
        <label className={cx(styles.Cell.InsetGroup, styles.AppLockPage.SwitchRow)}>
          <span className={styles.AppLockPage.SwitchLabel}>
            {localize('appLock.switchLabel', 'Require authentication')}
          </span>
          <input
            type='checkbox'
            className={styles.Choice.Input}
            data-test-id={AppLockSettings.switch}
            checked={enabled}
            // 系统验证不可用只阻止开启;已开启的锁必须始终可关,避免用户被反复锁定。
            disabled={!enabled && !deviceAuthAvailable}
            onChange={(event) => handleToggle(event.target.checked)}
          />
        </label>
        <p className={styles.AppLockPage.GroupDesc}>
          {localize(
            'appLock.desc',
            'When enabled, returning to the app requires fingerprint, face, or device passcode verification. Your database encryption password also unlocks the app. Membership is required.',
          )}
        </p>
        {deviceAuthAvailable === false && (
          <p className={styles.AppLockPage.WarnDesc} data-test-id={AppLockSettings.unsupportedHint}>
            {localize(
              'appLock.unsupported',
              'System authentication is unavailable. Set up a screen lock or biometrics on this device first.',
            )}
          </p>
        )}
      </div>
      {showEnableForm && !enabled && (
        <div className={styles.Common.SectionGap} data-test-id={AppLockSettings.enableCard}>
          <div className={styles.Cell.InsetGroup}>
            <div className={styles.Field.InputRow}>
              <input
                type='password'
                className={styles.Field.BareInput}
                data-test-id={AppLockSettings.keyInput}
                placeholder={localize('appLock.keyPlaceholder', 'Database encryption password')}
                value={recoveryKey}
                onChange={(event) => {
                  setRecoveryKey(event.target.value);
                  setKeyError(undefined);
                }}
              />
            </div>
            {keyError && (
              <p className={styles.AppLockPage.InputError} data-test-id={AppLockSettings.keyError}>
                {keyError}
              </p>
            )}
          </div>
          <p className={styles.AppLockPage.WarnDesc}>
            {localize(
              'appLock.enable.warning',
              'Verify your database encryption password to turn this on. Keep the password safe: if it is lost, data synced to the cloud cannot be recovered.',
            )}
          </p>
          <div className={styles.AppLockPage.Actions}>
            <button
              type='button'
              className={styles.WeuiButton.Primary}
              data-test-id={AppLockSettings.confirmEnable}
              disabled={verifying || recoveryKey.trim().length === 0}
              onClick={() => void confirmEnable()}
            >
              {localize('appLock.enable.confirm', 'Verify and turn on')}
            </button>
            <button
              type='button'
              className={styles.WeuiButton.Default}
              data-test-id={AppLockSettings.cancelEnable}
              onClick={closeEnableForm}
            >
              {localize('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}
    </HeaderPage>
  );
}
