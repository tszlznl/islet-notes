import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface DateTimePickerOptions {
  title: string;
  value: Date;
  max?: Date;
  rootTestId?: string;
  confirmTestId?: string;
  cancelTestId?: string;
  onConfirm: (value: Date) => void | Promise<void>;
  onCancel?: () => void;
}

export class DateTimePickerController implements IDisposable {
  static create(options: DateTimePickerOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.dateTimePicker,
      zIndex.dialog,
      (initOptions) =>
        instantiationService.createInstance(DateTimePickerController, options, initOptions),
    );
  }

  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: DateTimePickerOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string {
    return this.options.title;
  }

  get value(): Date {
    return this.options.value;
  }

  get max(): Date | undefined {
    return this.options.max;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get confirmTestId(): string | undefined {
    return this.options.confirmTestId;
  }

  get cancelTestId(): string | undefined {
    return this.options.cancelTestId;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  confirm(value: Date): void {
    void Promise.resolve(this.options.onConfirm(value)).finally(() => this.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
