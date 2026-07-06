import type { ImageAttachmentRecord } from '@/core/diary/type';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useImagePreview } from '@/mobile/overlay/imagePreview/useImagePreview';
import { styles } from '@/mobile/styles/ui';
import { DiaryMedia } from '@/mobile/test.id';
import React, { useRef } from 'react';

interface DiaryMediaImageCellProps {
  attachment: ImageAttachmentRecord;
  previewImages: ImageAttachmentRecord[];
}

export function DiaryMediaImageCell({ attachment, previewImages }: DiaryMediaImageCellProps) {
  const url = useAttachmentThumbUrl(attachment, { role: 'thumbnail' });
  const showImagePreview = useImagePreview();
  const originRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={originRef}
      type='button'
      className={styles.DiaryMediaPage.Cell}
      data-test-id={DiaryMedia.imageButton}
      onClick={() =>
        showImagePreview({
          attachments: previewImages.length ? previewImages : [attachment],
          initialAttachmentId: attachment.id,
          originRef,
        })
      }
    >
      {url ? (
        <img
          className={styles.DiaryMediaPage.Image}
          data-test-id={DiaryMedia.image}
          src={url}
          alt=''
        />
      ) : (
        <span className={styles.DiaryMediaPage.Placeholder} />
      )}
    </button>
  );
}
