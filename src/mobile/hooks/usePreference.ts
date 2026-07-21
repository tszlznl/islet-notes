import { useService } from '@/hooks/use-service';
import { IHostService } from '@/services/native/common/hostService';
import type {
  HostPreferenceDefinition,
  PreferenceDefinition,
  PreferenceValue,
} from '@/services/preferences/common/preference';
import { useState } from 'react';

interface UsePreferenceOptions<T> {
  onSave?: (value: T) => void | Promise<void>;
}

type SetPreference<T> = (value: T | undefined) => Promise<void>;
type UsePreferenceResult<T> = [value: T, setValue: SetPreference<T>];

/** 从同步缓存读取偏好，并在当前消费组件内立即应用变更。 */
export function usePreference<TDefinition extends PreferenceDefinition>(
  definition: TDefinition,
  options?: UsePreferenceOptions<PreferenceValue<TDefinition>>,
): UsePreferenceResult<PreferenceValue<TDefinition>> {
  const hostService = useService(IHostService);
  const [value, setValue] = useState<PreferenceValue<TDefinition>>(() => {
    if (definition.channel === 'host') {
      return hostService.getPreference(
        definition as HostPreferenceDefinition,
      ) as PreferenceValue<TDefinition>;
    }
    const storedValue = localStorage.getItem(definition.key);
    if (storedValue === null) return definition.defaultValue as PreferenceValue<TDefinition>;
    const result = definition.schema.safeParse(storedValue);
    return (result.success ? result.data : definition.defaultValue) as PreferenceValue<TDefinition>;
  });

  const setPreference: SetPreference<PreferenceValue<TDefinition>> = async (nextValue) => {
    const previousValue = value;
    const effectiveValue = (nextValue ?? definition.defaultValue) as PreferenceValue<TDefinition>;
    setValue(effectiveValue);
    try {
      if (definition.channel === 'host') {
        const hostDefinition = definition as HostPreferenceDefinition;
        if (nextValue === undefined) await hostService.clearPreference(hostDefinition);
        else await hostService.savePreference(hostDefinition, nextValue);
      } else {
        if (nextValue === undefined) {
          localStorage.removeItem(definition.key);
        } else {
          const parsedValue = definition.schema.parse(nextValue);
          if (typeof parsedValue !== 'string') {
            throw new Error(`Local preference "${definition.key}" must serialize to a string.`);
          }
          localStorage.setItem(definition.key, parsedValue);
        }
      }
    } catch (error) {
      setValue(previousValue);
      throw error;
    }
    await options?.onSave?.(effectiveValue);
  };

  return [value, setPreference];
}
