import { z } from 'zod';
import { definePreference } from '@/services/preferences/common/preference';

export const SpeechRecognitionConfigSchema = z.object({
  provider: z.literal('baidu'),
  apiKey: z.string(),
  secretKey: z.string(),
  autoTranscribe: z.boolean().default(true),
});

export type BaiduSpeechRecognitionConfigRecord = z.infer<typeof SpeechRecognitionConfigSchema>;

export type SpeechRecognitionConfigRecord = BaiduSpeechRecognitionConfigRecord;

export const SpeechRecognitionConfigPreference = definePreference({
  channel: 'host',
  key: 'speech-recognition',
  schema: SpeechRecognitionConfigSchema.nullable(),
  defaultValue: null,
});

export type SpeechRecognitionCredentials = Pick<
  BaiduSpeechRecognitionConfigRecord,
  'apiKey' | 'secretKey'
>;
