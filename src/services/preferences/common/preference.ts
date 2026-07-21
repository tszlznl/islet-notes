import type { output, ZodType } from 'zod';

export type PreferenceChannel = 'host' | 'localStorage';

export interface PreferenceDefinition<
  TSchema extends ZodType = ZodType,
  TChannel extends PreferenceChannel = PreferenceChannel,
> {
  readonly channel: TChannel;
  readonly key: string;
  readonly schema: TSchema;
  readonly defaultValue: output<TSchema>;
}

export type HostPreferenceDefinition<TSchema extends ZodType = ZodType> = PreferenceDefinition<
  TSchema,
  'host'
>;

export type LocalStoragePreferenceDefinition<TSchema extends ZodType<string> = ZodType<string>> =
  PreferenceDefinition<TSchema, 'localStorage'>;

export type PreferenceValue<TDefinition extends PreferenceDefinition> = output<
  TDefinition['schema']
>;

/** 将偏好的存储渠道、校验规则和默认值收敛为一个强类型定义。 */
export function definePreference<TSchema extends ZodType>(
  definition: HostPreferenceDefinition<TSchema>,
): HostPreferenceDefinition<TSchema>;
export function definePreference<TSchema extends ZodType<string>>(
  definition: LocalStoragePreferenceDefinition<TSchema>,
): LocalStoragePreferenceDefinition<TSchema>;
export function definePreference(definition: PreferenceDefinition): PreferenceDefinition {
  return definition;
}
