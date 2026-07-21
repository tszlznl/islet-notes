import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles, zIndex } from '@/mobile/styles/ui';
import { AppLock } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IAppLockService } from '@/services/appLock/common/appLockService';
import { IHostService } from '@/services/native/common/hostService';
import { LockKeyhole } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

/** 身份验证锁定页：覆盖全部内容与浮层，验证通过（或输入恢复密钥）后消失。 */
export function AppLockScreen() {
  const appLockService = useService(IAppLockService);
  const hostService = useService(IHostService);
  useWatchEvent(appLockService.onDidChange);
  const locked = appLockService.locked;

  const [deviceAuthAvailable, setDeviceAuthAvailable] = useState<boolean>();
  useEffect(() => {
    if (!locked) return;
    let disposed = false;
    void hostService.canUseDeviceAuth().then((available) => {
      if (!disposed) setDeviceAuthAvailable(available);
    });
    return () => {
      disposed = true;
    };
  }, [locked, hostService]);

  // 锁定期间可见时自动调起一次系统验证；重新退到后台后允许下次恢复时再次调起。
  useEffect(() => {
    if (!locked || !deviceAuthAvailable) return;
    let attempted = false;
    const tryAuth = () => {
      if (attempted || document.visibilityState !== 'visible') return;
      attempted = true;
      void appLockService.unlockWithDeviceAuth();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) attempted = false;
      else tryAuth();
    };
    tryAuth();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [locked, deviceAuthAvailable, appLockService]);

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [keyError, setKeyError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  useEffect(() => {
    if (locked) return;
    setShowKeyInput(false);
    setRecoveryKey('');
    setKeyError(undefined);
  }, [locked]);

  // 锁定时接管系统返回键，避免返回到锁定页下方的内容。
  const exitApp = useCallback(() => hostService.exitApp(), [hostService]);
  useBackButton(locked ? exitApp : undefined);

  if (!locked) return null;

  const submitRecoveryKey = async () => {
    if (verifying) return;
    setVerifying(true);
    const ok = await appLockService
      .unlockWithRecoveryKey(recoveryKey)
      .finally(() => setVerifying(false));
    if (!ok) {
      setKeyError(localize('appLock.enable.wrongKey', 'Incorrect password. Try again.'));
    }
  };

  return (
    <div
      className={styles.AppLockScreen.Root}
      style={{ zIndex: zIndex.appLock }}
      role='dialog'
      aria-modal='true'
      data-test-id={AppLock.screen}
    >
      <div className={styles.AppLockScreen.Main}>
        <LockKeyhole size={44} className={styles.AppLockScreen.Icon} aria-hidden='true' />
        <h1 className={styles.AppLockScreen.Title}>
          {localize('appLock.locked.title', 'Islet Journal is locked')}
        </h1>
        <p className={styles.AppLockScreen.Desc}>
          {localize('appLock.locked.desc', 'Verify your identity to continue')}
        </p>
      </div>
      {showKeyInput ? (
        <div className={styles.AppLockScreen.KeyArea}>
          <input
            type='password'
            className={styles.AppLockScreen.KeyInput}
            data-test-id={AppLock.keyInput}
            placeholder={localize('appLock.keyPlaceholder', 'Database encryption password')}
            value={recoveryKey}
            onChange={(event) => {
              setRecoveryKey(event.target.value);
              setKeyError(undefined);
            }}
          />
          {keyError && (
            <p className={styles.AppLockScreen.KeyError} data-test-id={AppLock.keyError}>
              {keyError}
            </p>
          )}
          <button
            type='button'
            className={styles.WeuiButton.Primary}
            data-test-id={AppLock.unlock}
            disabled={verifying || recoveryKey.trim().length === 0}
            onClick={() => void submitRecoveryKey()}
          >
            {localize('appLock.locked.unlock', 'Unlock')}
          </button>
        </div>
      ) : (
        <div className={styles.AppLockScreen.Actions}>
          {deviceAuthAvailable && (
            <button
              type='button'
              className={styles.WeuiButton.Primary}
              data-test-id={AppLock.deviceAuth}
              onClick={() => void appLockService.unlockWithDeviceAuth()}
            >
              {localize('appLock.locked.verify', 'Verify identity')}
            </button>
          )}
          <button
            type='button'
            className={styles.Link.Footer}
            data-test-id={AppLock.useRecoveryKey}
            onClick={() => setShowKeyInput(true)}
          >
            {localize('appLock.locked.useKey', 'Unlock with database encryption password')}
          </button>
        </div>
      )}
    </div>
  );
}
