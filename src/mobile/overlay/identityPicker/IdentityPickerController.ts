import type { ImageAttachmentRecord } from '@/core/diary/type';
import { zIndex } from '@/mobile/styles/ui';
import { OverlayEnum } from '@/services/overlay/common/overlayEnum';
import {
  IWorkbenchOverlayService,
  OverlayInitOptions,
} from '@/services/overlay/common/WorkbenchOverlayService';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { IInstantiationService } from 'vscf/platform/instantiation/common';

export interface IdentityPickerIdentity {
  id: string;
  name: string;
  avatarAttachment?: ImageAttachmentRecord;
}

export interface IdentityPickerOptions {
  title: string;
  identities: IdentityPickerIdentity[];
  rootTestId?: string;
  listTestId?: string;
  optionTestId?: string;
  closeTestId?: string;
  onSelect: (identityId: string) => void | Promise<void>;
  onCancel?: () => void;
}

export class IdentityPickerController implements IDisposable {
  static create(options: IdentityPickerOptions, instantiationService: IInstantiationService) {
    const workbenchOverlayService = instantiationService.invokeFunction((accessor) =>
      accessor.get(IWorkbenchOverlayService),
    );
    return workbenchOverlayService.createOverlay(
      'dialog',
      OverlayEnum.identityPicker,
      zIndex.dialog,
      (initOptions) =>
        instantiationService.createInstance(IdentityPickerController, options, initOptions),
    );
  }

  readonly zIndex: number;
  readonly instanceId: string;
  private disposed = false;

  constructor(
    private readonly options: IdentityPickerOptions,
    initOptions: OverlayInitOptions,
    @IWorkbenchOverlayService private readonly workbenchOverlayService: IWorkbenchOverlayService,
  ) {
    this.zIndex = initOptions.zIndex;
    this.instanceId = initOptions.instanceId;
  }

  get title(): string {
    return this.options.title;
  }

  get identities(): IdentityPickerIdentity[] {
    return this.options.identities;
  }

  get rootTestId(): string | undefined {
    return this.options.rootTestId;
  }

  get listTestId(): string | undefined {
    return this.options.listTestId;
  }

  get optionTestId(): string | undefined {
    return this.options.optionTestId;
  }

  get closeTestId(): string | undefined {
    return this.options.closeTestId;
  }

  cancel(): void {
    this.options.onCancel?.();
    this.dispose();
  }

  select(identityId: string): void {
    void Promise.resolve(this.options.onSelect(identityId)).finally(() => this.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.workbenchOverlayService.removeOverlay(this.instanceId);
  }
}
