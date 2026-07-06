import { useService } from '@/hooks/use-service';
import { IDiaryService } from '@/services/diary/common/diaryService';
import {
  audioAttachmentTaskToAttachment,
  IFileAssetService,
  imageAttachmentTaskToAttachment,
  videoAttachmentTaskToAttachment,
} from '@/services/fileAsset/common/fileAssetService';
import { IHostService } from '@/services/native/common/hostService';
import {
  SPEECH_RECOGNITION_CONFIG_KEY,
  SpeechRecognitionConfigSchema,
} from '@/services/speechRecognition/common/speechRecognitionConfig';
import { ISpeechRecognitionService } from '@/services/speechRecognition/common/speechRecognitionService';
import { useEffect, useRef } from 'react';

export function useAttachmentUploadCommitter() {
  const diaryService = useService(IDiaryService);
  const fileAssetService = useService(IFileAssetService);
  const hostService = useService(IHostService);
  const speechRecognitionService = useService(ISpeechRecognitionService);
  const committedTaskIds = useRef(new Set<string>());

  useEffect(() => {
    let disposed = false;

    const commitDoneTasks = async () => {
      const tasks = await fileAssetService.listAttachmentTasks();
      if (disposed) return;
      const speechConfig = await hostService.getPreference(
        SPEECH_RECOGNITION_CONFIG_KEY,
        SpeechRecognitionConfigSchema,
      );
      if (disposed) return;
      const autoTranscribe = speechConfig?.autoTranscribe ?? false;
      for (const task of tasks) {
        if (task.status !== 'done') continue;
        if (committedTaskIds.current.has(task.id)) continue;
        committedTaskIds.current.add(task.id);
        // 落库后再触发识别:entry 由 model 生成 id,这里用它驱动 SpeechRecognitionService。
        if (task.type === 'audio') {
          const attachment = audioAttachmentTaskToAttachment(task);
          const entryId = diaryService.addAttachmentEntry({
            attachment,
            createdAt: task.createdAt,
            identityId: task.identityId,
          });
          if (autoTranscribe) speechRecognitionService.recognize(entryId, attachment);
        } else if (task.type === 'video') {
          diaryService.addAttachmentEntry({
            attachment: videoAttachmentTaskToAttachment(task),
            createdAt: task.createdAt,
            identityId: task.identityId,
          });
        } else {
          diaryService.addAttachmentEntry({
            attachment: imageAttachmentTaskToAttachment(task),
            createdAt: task.createdAt,
            identityId: task.identityId,
          });
        }
        void fileAssetService.deleteAttachmentTask(task.id);
      }
    };

    void commitDoneTasks();
    const listener = fileAssetService.onDidChangeTasks(() => {
      void commitDoneTasks();
    });
    return () => {
      disposed = true;
      listener.dispose();
    };
  }, [diaryService, fileAssetService, hostService, speechRecognitionService]);
}
