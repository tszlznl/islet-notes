import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { useService } from '@/hooks/use-service';
import { ImageLoadFailedPlaceholder } from '@/mobile/components/image/ImageLoadFailedPlaceholder';
import { ImageLoadingPlaceholder } from '@/mobile/components/image/ImageLoadingPlaceholder';
import { useEntryLongPressActions } from '@/mobile/hooks/useEntryLongPressActions';
import { useImagePreview } from '@/mobile/overlay/imagePreview/useImagePreview';
import { useVideoPlayer } from '@/mobile/overlay/videoPlayer/useVideoPlayer';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { loadImageUrl } from '@/mobile/utils/imageLoad';
import { localize } from '@/nls';
import { CircleDotDashed } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getImageMessageStyle } from './utils';
import type { ImageMessageProps } from './types';

export function AttachmentImage({ entryId, attachment, previewAttachments }: ImageMessageProps) {
  const fileAssetService = useService(IFileAssetService);
  const showImagePreview = useImagePreview();
  const showVideoPlayer = useVideoPlayer();
  const highlighted = useIsEntryHighlighted(entryId);
  const { anchorRef, longPressEvents } = useEntryLongPressActions<HTMLButtonElement>(entryId);
  const [thumbUrl, setThumbUrl] = useState<string>();
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbnailRefreshAttempted = useRef(false);
  const imageStyle = getImageMessageStyle(attachment.width, attachment.height);
  const thumbnailKey = attachment.thumbS3Key ?? attachment.s3Key;
  const livePhoto = attachment.livePhoto;

  useEffect(() => {
    let disposed = false;
    async function load() {
      setThumbLoaded(false);
      setThumbFailed(false);
      setThumbUrl(undefined);
      thumbnailRefreshAttempted.current = false;
      if (!thumbnailKey) {
        setThumbFailed(true);
        return;
      }
      try {
        const url = await loadImageUrl(fileAssetService, thumbnailKey, {
          role: 'thumbnail',
        });
        if (!disposed) {
          if (url) {
            setThumbUrl(url);
            setThumbLoaded(true);
          } else {
            setThumbFailed(true);
          }
        }
      } catch {
        if (!disposed) setThumbFailed(true);
      }
    }
    void load();
    return () => {
      disposed = true;
    };
  }, [fileAssetService, thumbnailKey]);

  return (
    <button
      ref={anchorRef}
      className={styles.AttachmentImage.ImageButton}
      type='button'
      data-test-id={DiaryChat.imageButton}
      onClick={() => {
        showImagePreview({
          attachments: previewAttachments.length ? previewAttachments : [attachment],
          initialAttachmentId: attachment.id,
          originRef: anchorRef,
        });
      }}
      {...longPressEvents}
    >
      {thumbUrl && !thumbFailed && (
        <img
          className={styles.AttachmentImage.Image}
          data-test-id={DiaryChat.image}
          src={thumbUrl}
          alt=''
          style={imageStyle}
          onLoad={() => setThumbLoaded(true)}
          onError={() => {
            setThumbLoaded(false);
            if (thumbnailKey && !thumbnailRefreshAttempted.current) {
              thumbnailRefreshAttempted.current = true;
              void loadImageUrl(fileAssetService, thumbnailKey, {
                role: 'thumbnail',
              })
                .then((url) => {
                  if (url) {
                    setThumbUrl(url);
                    setThumbLoaded(true);
                    setThumbFailed(false);
                  } else {
                    setThumbFailed(true);
                  }
                })
                .catch(() => setThumbFailed(true));
            } else {
              setThumbFailed(true);
            }
          }}
        />
      )}
      {thumbFailed ? (
        <ImageLoadFailedPlaceholder
          className={styles.AttachmentImage.PlaceholderFull}
          style={imageStyle}
        />
      ) : (
        (!thumbUrl || !thumbLoaded) && (
          <ImageLoadingPlaceholder
            className={
              thumbUrl
                ? styles.AttachmentImage.PlaceholderOverThumb
                : styles.AttachmentImage.PlaceholderFull
            }
            style={imageStyle}
          />
        )
      )}
      {livePhoto && (
        <span
          className={styles.AttachmentImage.LivePhotoBadge}
          data-test-id={DiaryChat.livePhotoBadge}
          role='button'
          tabIndex={0}
          aria-label={localize('diary.livePhoto.play', 'Play Live Photo')}
          onClick={(event) => {
            event.stopPropagation();
            showVideoPlayer({
              loadUrl: () => fileAssetService.getLivePhotoVideoUrl(attachment),
            });
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            showVideoPlayer({
              loadUrl: () => fileAssetService.getLivePhotoVideoUrl(attachment),
            });
          }}
        >
          <CircleDotDashed size={18} />
        </span>
      )}
      <EntryHighlightOverlay active={highlighted} />
    </button>
  );
}
