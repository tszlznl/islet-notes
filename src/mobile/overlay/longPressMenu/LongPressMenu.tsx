import { useService } from '@/hooks/use-service';
import { useWatchEvent } from '@/hooks/use-watch-event';
import { useBackButton } from '@/mobile/hooks/useBackButton';
import { styles } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import { IWorkbenchOverlayService } from '@/services/overlay/common/WorkbenchOverlayService';
import React, { type CSSProperties } from 'react';
import { LongPressMenuController } from './LongPressMenuController';

const MENU_GAP = 8;
const MENU_MARGIN = 8;
const ACTION_WIDTH = 64;
const ACTION_HEIGHT = 56;
const PANEL_X_PADDING = 16;
const PANEL_Y_PADDING = 16;
const MAX_COLUMNS = 5;

export function LongPressMenu() {
  const workbenchOverlayService = useService(IWorkbenchOverlayService);
  useWatchEvent(workbenchOverlayService.onOverlayChange);
  const controller = workbenchOverlayService.getOverlay<LongPressMenuController>(
    OverlayEnum.longPressMenu,
  );
  useWatchEvent(controller?.onStatusChange);
  useBackButton(controller ? () => controller.dispose() : undefined);

  if (!controller || controller.actions.length === 0) return null;

  const columns = Math.min(MAX_COLUMNS, controller.actions.length);
  const rows = Math.ceil(controller.actions.length / columns);
  const width = columns * ACTION_WIDTH + PANEL_X_PADDING;
  const height = rows * ACTION_HEIGHT + PANEL_Y_PADDING;
  const anchorRect = controller.anchorRect;
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const left = clamp(
    anchorCenterX - width / 2,
    MENU_MARGIN,
    window.innerWidth - width - MENU_MARGIN,
  );
  const preferredTop = anchorRect.top - height - MENU_GAP;
  const top =
    preferredTop >= MENU_MARGIN
      ? preferredTop
      : clamp(anchorRect.bottom + MENU_GAP, MENU_MARGIN, window.innerHeight - height - MENU_MARGIN);
  const panelStyle: CSSProperties = {
    left,
    top,
    ['--menu-columns' as string]: columns,
  };

  return (
    <div
      className={styles.LongPressMenu.Root}
      role='presentation'
      style={{ zIndex: controller.zIndex }}
    >
      <div
        className={styles.LongPressMenu.Backdrop}
        aria-hidden='true'
        onPointerDown={() => controller.dispose()}
      />
      <div className={styles.LongPressMenu.Panel} role='menu' style={panelStyle}>
        {controller.actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={styles.LongPressMenu.Action}
              type='button'
              role='menuitem'
              disabled={action.disabled}
              onClick={() => void controller.run(action)}
            >
              <span className={styles.LongPressMenu.Icon} aria-hidden='true'>
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <span className={styles.LongPressMenu.Label}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
