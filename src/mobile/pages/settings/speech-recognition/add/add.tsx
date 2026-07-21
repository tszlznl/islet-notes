import { useService } from '@/hooks/use-service';
import { FormPage } from '@/mobile/components/layout/FormPage';
import { HeaderLayoutPage } from '@/mobile/components/layout/HeaderLayoutPage';
import { FormGroup } from '@/mobile/components/WeuiForm';
import { useForm } from '@/mobile/hooks/useForm';
import { usePreference } from '@/mobile/hooks/usePreference';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useTopTips } from '@/mobile/overlay/topTips/useTopTips';
import { SpeechRecognitionSettings } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { SpeechRecognitionConfigPreference } from '@/services/speechRecognition/common/speechRecognitionConfig';
import { ISpeechRecognitionService } from '@/services/speechRecognition/common/speechRecognitionService';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

type SpeechRecognitionFormValues = {
  apiKey: string;
  secretKey: string;
  autoTranscribe: boolean;
  dataSharingConsent: boolean;
};

export function SettingsSpeechRecognitionAddPage() {
  const navigate = useNavigate();
  const [, setSpeechRecognitionConfig] = usePreference(SpeechRecognitionConfigPreference);
  const speechRecognitionService = useService(ISpeechRecognitionService);
  const showLoadingToast = useLoadingToast();
  const showSuccessToast = useSuccessToast();
  const showTopTips = useTopTips();
  const [saving, setSaving] = useState(false);
  const form = useForm<SpeechRecognitionFormValues>({
    initialValues: {
      autoTranscribe: true,
      dataSharingConsent: false,
    },
    requiredMessage: (field) =>
      localize('settings.speechRecognition.required', '{0} is required.', field.label),
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        testId: SpeechRecognitionSettings.apiKey,
        required: true,
      },
      {
        name: 'secretKey',
        label: 'Secret Key',
        type: 'password',
        testId: SpeechRecognitionSettings.secretKey,
        required: true,
      },
      {
        name: 'autoTranscribe',
        label: localize('settings.speechRecognition.autoTranscribe', 'Auto-transcribe voice'),
        type: 'checkbox',
        testId: SpeechRecognitionSettings.autoTranscribe,
      },
    ],
  });

  const save = async () => {
    if (saving || !form.verify()) return;
    if (!form.values.dataSharingConsent) {
      showTopTips({
        message: localize(
          'settings.speechRecognition.consentRequired',
          'Allow sending voice audio to Baidu AI Cloud before saving.',
        ),
      });
      return;
    }
    const config = {
      apiKey: form.values.apiKey,
      secretKey: form.values.secretKey,
    };
    const loadingToast = showLoadingToast({
      message: localize('settings.speechRecognition.testing', 'Testing connection...'),
    });
    setSaving(true);
    try {
      await speechRecognitionService.testConfig(config);
      await setSpeechRecognitionConfig({
        provider: 'baidu',
        apiKey: config.apiKey.trim(),
        secretKey: config.secretKey.trim(),
        autoTranscribe: form.values.autoTranscribe,
      });
      showSuccessToast({ message: localize('settings.speechRecognition.saved', 'Saved') });
      navigate('/settings/speech-recognition', { replace: true });
    } catch (error) {
      showTopTips({
        message:
          error instanceof Error
            ? error.message
            : localize('settings.speechRecognition.testFailed', 'Connection failed'),
      });
    } finally {
      loadingToast.dispose();
      setSaving(false);
    }
  };

  return (
    <HeaderLayoutPage
      rootClassName={styles.Page.SurfaceRoot}
      contentClassName={styles.WeuiForm.PageMain}
      pageTestId={SpeechRecognitionSettings.page}
      contentTestId={SpeechRecognitionSettings.content}
      header={{ showBack: true, tone: 'surface' }}
    >
      <FormPage
        title={localize('settings.speechRecognition.addTitle', 'Configure Baidu AI Cloud')}
        description={localize(
          'settings.speechRecognition.addFormDesc',
          'Turn voice messages into text, up to 59 seconds.',
        )}
        check={{
          label: localize(
            'settings.speechRecognition.dataSharingConsent',
            'I allow Islet to send voice message audio to Baidu AI Cloud for voice-to-text transcription.',
          ),
          checked: Boolean(form.values.dataSharingConsent),
          testId: SpeechRecognitionSettings.dataSharingConsent,
          onChange: (checked) => form.setValue('dataSharingConsent', checked),
        }}
        actions={[
          {
            label: localize('common.save', 'Save'),
            testId: SpeechRecognitionSettings.save,
            disabled: saving,
            onClick: () => void save(),
          },
        ]}
      >
        <FormGroup
          title={localize('settings.speechRecognition.configInfo', 'Configuration')}
          items={form.fields}
        />
        <p className={styles.WeuiForm.Description}>
          {localize(
            'settings.speechRecognition.consoleHint',
            'Create an app in the Baidu AI Cloud console and enable Short Speech Recognition Pro to get the API Key and Secret Key. These credentials are used for automatic transcription after sending voice messages and manual transcription from a voice message.',
          )}
        </p>
        <p className={styles.WeuiForm.Description}>
          {localize(
            'settings.speechRecognition.dataSharingDesc',
            'When voice to text runs, Islet sends the selected voice message audio to Baidu AI Cloud Short Speech Recognition Pro and saves the returned text in the same diary entry. For example, after you send a voice message, that audio may be sent to Baidu AI Cloud to generate its transcript.',
          )}
        </p>
      </FormPage>
    </HeaderLayoutPage>
  );
}
