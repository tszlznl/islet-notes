import { z } from 'zod';
import { definePreference } from '@/services/preferences/common/preference';

/** 身份功能偏好：控制聊天输入区是否显示身份选择按钮。 */
export const IdentityConfigSchema = z.object({
  chatEntryEnabled: z.boolean().default(true),
});

export type IdentityConfigRecord = z.infer<typeof IdentityConfigSchema>;

export const DEFAULT_IDENTITY_CONFIG: IdentityConfigRecord = {
  chatEntryEnabled: true,
};

export const IdentityConfigPreference = definePreference({
  channel: 'host',
  key: 'identity',
  schema: IdentityConfigSchema,
  defaultValue: DEFAULT_IDENTITY_CONFIG,
});
