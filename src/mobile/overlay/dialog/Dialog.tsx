import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { cx, styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React from 'react';
import { DialogController } from './DialogController';

export function Dialog() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<DialogController>(OverlayEnum.dialog);
  useBackButton(controller ? () => controller.cancel() : undefined);

  if (!controller) return null;

  return (
    <div
      className={styles.Dialog.Root}
      role='alertdialog'
      aria-modal='true'
      data-test-id={controller.rootTestId}
      style={{ zIndex: controller.zIndex }}
    >
      <div
        className={styles.Dialog.Backdrop}
        aria-hidden='true'
        onClick={() => controller.cancel()}
      />
      <div className={styles.Dialog.Dialog} data-test-id={controller.dialogTestId}>
        {controller.title && <div className={styles.Dialog.Title}>{controller.title}</div>}
        <div className={controller.title ? styles.Dialog.MessageWithTitle : styles.Dialog.Message}>
          {controller.message}
        </div>
        <div className={styles.Dialog.Actions}>
          <button
            className={styles.Dialog.CancelButton}
            type='button'
            data-test-id={controller.cancelTestId}
            onClick={() => controller.cancel()}
          >
            {controller.cancelLabel}
          </button>
          <button
            className={cx(
              styles.Dialog.ConfirmButton,
              controller.tone === 'primary'
                ? styles.Dialog.ConfirmPrimary
                : styles.Dialog.ConfirmDanger,
            )}
            type='button'
            data-test-id={controller.confirmTestId}
            onClick={() => controller.confirm()}
          >
            {controller.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
