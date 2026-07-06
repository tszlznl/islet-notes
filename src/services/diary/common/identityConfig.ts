import { z } from 'zod';

export const IDENTITY_CONFIG_KEY = 'identity';
export const IDENTITY_CONFIG_SWR_KEY = 'identity-config';

/** 身份功能偏好：控制聊天输入区是否显示身份选择按钮。 */
export const IdentityConfigSchema = z.object({
  chatEntryEnabled: z.boolean().default(true),
});

export type IdentityConfigRecord = z.infer<typeof IdentityConfigSchema>;
