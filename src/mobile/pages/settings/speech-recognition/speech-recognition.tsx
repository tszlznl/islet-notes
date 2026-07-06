import { useService } from '@/hooks/use-service';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup, type FormGroupItem } from '@/mobile/components/WeuiForm';
import { useDialog } from '@/mobile/overlay/dialog/useDialog';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { SpeechRecognitionSettings } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import {
  SPEECH_RECOGNITION_CONFIG_KEY,
  SPEECH_RECOGNITION_CONFIG_SWR_KEY,
  SpeechRecognitionConfigSchema,
} from '@/services/speechRecognition/common/speechRecognitionConfig';
import React from 'react';
import useSWR from 'swr';

export function SettingsSpeechRecognitionPage() {
  const navigationService = useService(INavigationService);
  const hostService = useService(IHostService);
  const showDialog = useDialog();
  const showSuccessToast = useSuccessToast();
  const { data: config, mutate } = useSWR(SPEECH_RECOGNITION_CONFIG_SWR_KEY, async () =>
    hostService.getPreference(SPEECH_RECOGNITION_CONFIG_KEY, SpeechRecognitionConfigSchema),
  );

  const deleteConfig = () => {
    showDialog({
      message: localize(
        'settings.speechRecognition.deleteConfirm',
        'Delete voice-to-text configuration? You can still send voice messages.',
      ),
      confirmLabel: localize('common.delete', 'Delete'),
      cancelLabel: localize('common.cancel', 'Cancel'),
      tone: 'danger',
      onConfirm: () => void clearConfig(),
    });
  };

  const clearConfig = async () => {
    await hostService.clearPreference(SPEECH_RECOGNITION_CONFIG_KEY);
    await mutate(undefined, { revalidate: false });
    showSuccessToast({ message: localize('settings.speechRecognition.deleted', 'Deleted') });
  };

  const setAutoTranscribe = async (enabled: boolean) => {
    if (!config || config.autoTranscribe === enabled) return;
    const nextConfig = { ...config, autoTranscribe: enabled };
    await hostService.savePreference(SPEECH_RECOGNITION_CONFIG_KEY, nextConfig);
    await mutate(nextConfig, { revalidate: false });
  };

  const items: FormGroupItem[] = config
    ? [
        {
          label: localize('settings.speechRecognition.provider', 'Provider'),
          value: localize('settings.speechRecognition.providerBaidu', 'Baidu AI Cloud'),
        },
        {
          label: 'API Key',
          value: maskApiKey(config.apiKey),
        },
        {
          label: 'Secret Key',
          value: maskApiKey(config.secretKey),
        },
        {
          label: localize('settings.speechRecognition.dataSharing', 'Data sharing'),
          value: localize(
            'settings.speechRecognition.dataSharingSummary',
            'Voice audio is sent to Baidu AI Cloud for transcription.',
          ),
        },
        {
          name: 'autoTranscribe',
          label: localize('settings.speechRecognition.autoTranscribe', 'Auto-transcribe voice'),
          type: 'checkbox',
          testId: SpeechRecognitionSettings.autoTranscribe,
          value: config.autoTranscribe,
          onChange: (value) => void setAutoTranscribe(Boolean(value)),
        },
      ]
    : [
        {
          type: 'navigation',
          icon: (
            <img
              className={styles.SpeechRecognitionSettingsPage.ProviderIcon}
              src='/icons/baiducloud-color.png'
              alt=''
              aria-hidden='true'
            />
          ),
          title: localize('settings.speechRecognition.providerBaidu', 'Baidu AI Cloud'),
          description: localize(
            'settings.speechRecognition.baiduDesc',
            'Short Speech Recognition Pro',
          ),
          testId: SpeechRecognitionSettings.add,
          onClick: () => navigationService.navigate({ path: '/settings/speech-recognition/add' }),
        },
      ];

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={SpeechRecognitionSettings.page}
      contentTestId={SpeechRecognitionSettings.content}
      header={{ showBack: true, tone: 'surface' }}
    >
      <FormPage
        title={localize('settings.speechRecognition.title', 'Voice to text')}
        description={
          config
            ? localize(
                'settings.speechRecognition.configuredDesc',
                'Voice to text is ready to use.',
              )
            : localize(
                'settings.speechRecognition.emptyDesc',
                'Configure a service to turn voice messages into text.',
              )
        }
        actions={
          config
            ? [
                {
                  label: localize('settings.speechRecognition.delete', 'Delete configuration'),
                  variant: 'warn',
                  testId: SpeechRecognitionSettings.delete,
                  onClick: deleteConfig,
                },
              ]
            : undefined
        }
      >
        <FormGroup
          title={
            config
              ? localize('settings.speechRecognition.current', 'Current service')
              : localize('settings.speechRecognition.service', 'Service')
          }
          items={items}
        />
        {!config && (
          <p className={styles.WeuiForm.Description}>
            {localize(
              'settings.speechRecognition.emptyHint',
              'You can still send voice messages without voice to text.',
            )}
          </p>
        )}
      </FormPage>
    </HeaderLayoutPage>
  );
}

function maskApiKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 2) return `${trimmed}********`;
  if (trimmed.length <= 4) return `${trimmed.slice(0, 2)}********`;
  return `${trimmed.slice(0, 2)}********${trimmed.slice(-2)}`;
}
