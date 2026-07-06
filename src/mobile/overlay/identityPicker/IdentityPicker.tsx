import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { CoverInitial } from '@/mobile/components/CoverInitial';
import { CoverThumb } from '@/mobile/components/CoverThumb';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import { X } from 'lucide-react';
import React, { useCallback } from 'react';
import { IdentityPickerController } from './IdentityPickerController';

/** 半屏身份选择器，交互与 NotebookPicker 一致，无搜索框。 */
export function IdentityPicker() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<IdentityPickerController>(
    OverlayEnum.identityPicker,
  );
  const handleCancel = useCallback(() => {
    controller?.cancel();
  }, [controller]);
  useBackButton(controller ? handleCancel : undefined);

  if (!controller) return null;

  return (
    <div
      className={styles.NotebookPicker.Root}
      role='dialog'
      aria-modal='true'
      aria-labelledby='identity-picker-title'
      data-test-id={controller.rootTestId}
      style={{ zIndex: controller.zIndex }}
    >
      <div className={styles.NotebookPicker.Backdrop} aria-hidden='true' onClick={handleCancel} />
      <div className={styles.NotebookPicker.Sheet}>
        <div className={styles.NotebookPicker.Header}>
          <span id='identity-picker-title' className={styles.NotebookPicker.Title}>
            {controller.title}
          </span>
          <button
            type='button'
            className={styles.NotebookPicker.CloseButton}
            aria-label={localize('common.close', 'Close')}
            data-test-id={controller.closeTestId}
            onClick={handleCancel}
          >
            <X size={22} />
          </button>
        </div>
        <div
          className={styles.NotebookPicker.List}
          role='listbox'
          data-test-id={controller.listTestId}
        >
          {controller.identities.map((identity) => (
            <button
              key={identity.id}
              type='button'
              className={styles.NotebookPicker.Item}
              role='option'
              aria-selected='false'
              data-test-id={controller.optionTestId}
              onClick={() => controller.select(identity.id)}
            >
              {identity.avatarAttachment ? (
                <CoverThumb
                  attachment={identity.avatarAttachment}
                  className={styles.NotebookPicker.ItemCover}
                />
              ) : (
                <CoverInitial
                  name={identity.name}
                  className={styles.NotebookPicker.ItemCover}
                  textClassName={styles.NotebookPicker.ItemCoverText}
                />
              )}
              <span className={styles.NotebookPicker.ItemName}>{identity.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
