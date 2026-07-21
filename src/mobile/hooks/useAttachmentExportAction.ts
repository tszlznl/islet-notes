import type { AttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import type { LongPressMenuAction } from '@/mobile/overlay/longPressMenu/LongPressMenuController';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import { Download } from 'lucide-react';

/**
 * 长按菜单"导出原文件"动作：取附件原文件 Blob，浏览器端下载、原生端打开系统分享面板。
 * 附件缺 s3Key（尚未上传完成等）时返回 undefined，菜单不显示导出入口。
 */
export function useAttachmentExportAction(
  attachment: AttachmentRecord,
): LongPressMenuAction | undefined {
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const showToast = useSuccessToast();
  const s3Key = attachment.s3Key;
  if (!s3Key) return undefined;

  return {
    id: 'export',
    label: localize('diary.media.exportAction', 'Export'),
    icon: Download,
    run: async () => {
      try {
        const blob = await fileAssetService.getFileBlob(s3Key);
        if (!blob) {
          throw new Error(localize('diary.media.exportMissing', 'Original file is missing'));
        }
        await hostService.exportBlobFile({
          filename: attachmentExportFilename(s3Key),
          blob,
        });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : String(error),
          icon: 'none',
        });
      }
    },
  };
}

/** 附件 key 形如 /attachments/<shard>/<id>.<ext>，取末段作为导出文件名。 */
function attachmentExportFilename(s3Key: string): string {
  const segments = s3Key.split('/');
  return segments[segments.length - 1] || s3Key;
}
