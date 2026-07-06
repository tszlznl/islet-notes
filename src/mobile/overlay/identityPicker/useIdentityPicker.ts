import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { IdentityPickerController, IdentityPickerOptions } from './IdentityPickerController';

export function useIdentityPicker() {
  const instantiationService = useService(IInstantiationService);
  return (options: IdentityPickerOptions) =>
    IdentityPickerController.create(options, instantiationService);
}
