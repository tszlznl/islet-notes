import { definePreference } from '@/services/preferences/common/preference';
import { z } from 'zod';

export const AppLockConfigSchema = z.object({
  enabled: z.boolean(),
  /** 开启时校验通过的恢复密钥指纹；随锁配置持久化，云同步被清除后仍可用恢复密钥解锁。 */
  recoveryKeyHash: z.string().optional(),
});

export type AppLockConfig = z.infer<typeof AppLockConfigSchema>;

export const AppLockConfigPreference = definePreference({
  channel: 'host',
  key: 'app-lock',
  schema: AppLockConfigSchema,
  defaultValue: { enabled: false },
});
