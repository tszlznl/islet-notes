import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { cx, styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React, { useEffect, useState } from 'react';
import { ActionSheetController } from './ActionSheetController';

export function ActionSheet() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<ActionSheetController>(
    OverlayEnum.actionSheet,
  );
  const visible = !!controller && controller.actions.length > 0;
  useBackButton(visible && controller ? () => controller.dispose() : undefined);
  // Mount off-screen, then flip to the entered state on the next frame so the
  // panel slides up instead of appearing instantly.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!visible) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!controller || controller.actions.length === 0) return null;

  const hasHeader = !!controller.title || !!controller.description;

  return (
    <div
      className={styles.ActionSheet.Root}
      role='presentation'
      style={{ zIndex: controller.zIndex }}
      data-test-id={controller.rootTestId}
    >
      <div
        className={cx(
          styles.ActionSheet.Backdrop,
          entered ? styles.ActionSheet.BackdropVisible : styles.ActionSheet.BackdropHidden,
        )}
        aria-hidden='true'
        onClick={() => controller.dispose()}
      />
      <div
        className={cx(
          styles.ActionSheet.Panel,
          entered ? styles.ActionSheet.PanelVisible : styles.ActionSheet.PanelHidden,
        )}
        role='menu'
      >
        <div className={styles.ActionSheet.ActionGroup}>
          {hasHeader && (
            <div className={styles.ActionSheet.Header}>
              {controller.title && (
                <div className={styles.ActionSheet.Caption}>{controller.title}</div>
              )}
              {controller.description && (
                <div
                  className={styles.ActionSheet.Description}
                  data-test-id={controller.descriptionTestId}
                >
                  {controller.description}
                </div>
              )}
            </div>
          )}
          {controller.actions.map((action, index) => (
            <button
              key={action.id}
              className={cx(
                styles.ActionSheet.Action,
                index === controller.actions.length - 1 && styles.ActionSheet.ActionLast,
                action.tone === 'danger'
                  ? styles.ActionSheet.ActionDanger
                  : styles.ActionSheet.ActionDefault,
              )}
              type='button'
              role='menuitem'
              disabled={action.disabled}
              data-test-id={action.testId}
              onClick={() => void controller.run(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button
          className={styles.ActionSheet.CancelAction}
          type='button'
          data-test-id={controller.cancelTestId}
          onClick={() => controller.dispose()}
        >
          {controller.cancelLabel}
        </button>
      </div>
    </div>
  );
}
