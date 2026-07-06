import { useService } from '@/hooks/use-service';
import { useVideoPreview } from '@/mobile/overlay/videoPreview/useVideoPreview';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import {
  ImagePickSource,
  IHostService,
  type HostVideoPick,
} from '@/services/native/common/hostService';
import { useMemo } from 'react';

interface UseDiaryChatMediaActionsOptions {
  notebookId: string;
  closePlusPanel: () => void;
  showError: (message: string) => void;
}

export function useDiaryChatMediaActions({
  notebookId,
  closePlusPanel,
  showError,
}: UseDiaryChatMediaActionsOptions) {
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const showVideoPreview = useVideoPreview();
  const videoSupported = useMemo(() => hostService.caniuse('videoUpload'), [hostService]);

  const uploadImage = async (file: Blob) => {
    await fileAssetService.uploadImageAttachment({ notebookId, file });
  };

  const getVideoCacheScope = () => fileAssetService.getStorageScope();

  // 拍照：系统相机拍照模式，照片直接进日记。
  const takePhoto = async () => {
    try {
      closePlusPanel();
      const file = await hostService.pickImageBlob(ImagePickSource.Camera);
      if (file) await uploadImage(file);
    } catch (event) {
      showError(event instanceof Error ? event.message : String(event));
    }
  };

  // 相册：Android 上可选照片或视频；照片直接进日记，视频弹预览半屏。
  const pickFromAlbum = async () => {
    try {
      closePlusPanel();
      if (!videoSupported) {
        const file = await hostService.pickImageBlob(ImagePickSource.Photos);
        if (file) await uploadImage(file);
        return;
      }
      const media = await hostService.pickMediaFromGallery({ cacheScope: getVideoCacheScope() });
      if (!media) return;
      if (media.kind === 'image') {
        await uploadImage(media.blob);
        return;
      }
      openVideoPreview(media.video);
    } catch (event) {
      showError(event instanceof Error ? event.message : String(event));
    }
  };

  // 拍视频：系统相机录像模式，录完弹预览半屏。
  const startRecordVideo = async () => {
    try {
      closePlusPanel();
      const video = await hostService.recordVideo({ cacheScope: getVideoCacheScope() });
      if (video) openVideoPreview(video);
    } catch (event) {
      showError(event instanceof Error ? event.message : String(event));
    }
  };

  // 弹出视频预览 overlay（选是否原画质）；确定后进入后台处理。
  const openVideoPreview = (video: HostVideoPick) => {
    showVideoPreview({
      video,
      onConfirm: (originalQuality) => void confirmVideo(video, originalQuality),
      onCancel: () =>
        void hostService
          .cleanVideoRecord({ sourcePath: video.sourcePath, cacheScope: getVideoCacheScope() })
          .catch(() => undefined),
    });
  };

  // 确定：半屏关闭，视频进日记标“处理中”，转码与上传走后台。
  const confirmVideo = async (video: HostVideoPick, originalQuality: boolean) => {
    try {
      // 优先用封面的自然宽高：系统返回的 resolution 可能未计旋转（竖屏报成横屏），
      // 而封面是按显示方向出的，比例才正确，能修正“处理中”占位比例。
      let width = video.width;
      let height = video.height;
      if (video.thumbnail) {
        const dims = await readImageDimsFromUrl(video.thumbnail);
        if (dims.width && dims.height) {
          width = dims.width;
          height = dims.height;
        }
      }
      // 是否“已够小可跳过转码”由原生按真实分辨率判断；这里只传用户是否勾了原画质。
      await fileAssetService.uploadVideoAttachment({
        notebookId,
        sourcePath: video.sourcePath,
        originalQuality,
        size: video.size,
        mimeType: video.mimeType,
        width,
        height,
        durationMs: video.durationMs,
        previewThumbnail: video.thumbnail,
      });
    } catch (event) {
      await hostService
        .cleanVideoRecord({ sourcePath: video.sourcePath, cacheScope: getVideoCacheScope() })
        .catch(() => undefined);
      showError(event instanceof Error ? event.message : String(event));
    }
  };

  return {
    videoSupported,
    takePhoto,
    pickFromAlbum,
    startRecordVideo,
  };
}

// 从封面 data URL 读取自然宽高，用于转码前未知尺寸时的占位比例。
function readImageDimsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}
