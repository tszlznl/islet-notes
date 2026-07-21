import { useService } from '@/hooks/use-service';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { DateTimePickerController, DateTimePickerOptions } from './DateTimePickerController';

export function useDateTimePicker() {
  const instantiationService = useService(IInstantiationService);
  return (options: DateTimePickerOptions) =>
    DateTimePickerController.create(options, instantiationService);
}
