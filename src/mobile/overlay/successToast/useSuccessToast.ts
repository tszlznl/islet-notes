import { useService } from '@/hooks/use-service';
import { useCallback } from 'react';
import { IInstantiationService } from 'vscf/platform/instantiation/common';
import { SuccessToastController, SuccessToastOptions } from './SuccessToastController';

export function useSuccessToast() {
  const instantiationService = useService(IInstantiationService);
  // 引用稳定，便于作为 effect 依赖（如全局的附件落库 committer）。
  return useCallback(
    (options: SuccessToastOptions) => SuccessToastController.create(options, instantiationService),
    [instantiationService],
  );
}
