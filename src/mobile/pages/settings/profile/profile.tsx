import { PROFILE_ATTACHMENT_NOTEBOOK_ID } from '@/core/diary/type';
import { localize } from '@/nls';
import { PageHeader } from '@/mobile/components/PageHeader';
import { CellListGroup } from '@/mobile/components/CellList';
import { useProfileAvatar } from '@/mobile/hooks/useProfileAvatar';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { useLoadingToast } from '@/mobile/overlay/loadingToast/useLoadingToast';
import { Profile } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  IFileAssetService,
  imageUploadResultToAttachment,
} from '@/services/fileAsset/common/fileAssetService';
import { ImagePickSource, IHostService } from '@/services/native/common/hostService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';

export function SettingsProfilePage() {
  const navigationService = useService(INavigationService);
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const showLoadingToast = useLoadingToast();
  const model = useDiaryModel();
  const { url: avatarUrl } = useProfileAvatar();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickAvatar = async () => {
    if (uploading) return;
    let loadingToast: { dispose(): void } | undefined;
    try {
      setError('');
      const file = await hostService.pickImageBlob(ImagePickSource.Photos);
      if (!file) return;
      loadingToast = showLoadingToast({ message: localize('common.uploading', 'Uploading...') });
      setUploading(true);
      const result = await fileAssetService.uploadImage(file, { thumbnail: true });
      const attachment = imageUploadResultToAttachment(result, PROFILE_ATTACHMENT_NOTEBOOK_ID);
      diaryService.addAttachment(attachment);
      diaryService.updateProfileAvatar(attachment.id);
    } catch (event) {
      setError(event instanceof Error ? event.message : String(event));
    } finally {
      loadingToast?.dispose();
      setUploading(false);
    }
  };

  return (
    <div className={styles.Page.GroupedRoot} data-test-id={Profile.page}>
      <PageHeader title={localize('profile.title', 'Profile')} showBack />
      <main
        className={cx(styles.Page.Content, styles.Cell.GroupStackLoose)}
        data-test-id={Profile.content}
      >
        <CellListGroup
          items={[
            {
              label: localize('profile.avatar', 'Avatar'),
              right: { type: 'image', url: avatarUrl, testId: Profile.avatarImage },
              testId: Profile.avatar,
              onClick: () => void pickAvatar(),
            },
            {
              label: localize('profile.name', 'Name'),
              right: model.profile.name ? { type: 'value', text: model.profile.name } : undefined,
              testId: Profile.name,
              onClick: () => navigationService.navigate({ path: '/settings/name' }),
            },
            {
              label: localize('messageColor.title', 'Message color'),
              testId: Profile.messageColor,
              onClick: () =>
                navigationService.navigate({ path: '/settings/profile/message-color' }),
            },
          ]}
        />
        {error && (
          <div
            className={cx(styles.Text.Error, styles.Common.PagePadding)}
            data-test-id={Profile.error}
          >
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
