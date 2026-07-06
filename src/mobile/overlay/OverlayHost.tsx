import React from 'react';
import { ActionSheet } from './actionSheet/ActionSheet';
import { Dialog } from './dialog/Dialog';
import { ImagePreview } from './imagePreview/ImagePreview';
import { LoadingToast } from './loadingToast/LoadingToast';
import { IdentityPicker } from './identityPicker/IdentityPicker';
import { LongPressMenu } from './longPressMenu/LongPressMenu';
import { NotebookPicker } from './notebookPicker/NotebookPicker';
import { SuccessToast } from './successToast/SuccessToast';
import { TextInputDialog } from './textInputDialog/TextInputDialog';
import { TopTips } from './topTips/TopTips';
import { VideoPlayerOverlay } from './videoPlayer/VideoPlayerOverlay';
import { VideoPreview } from './videoPreview/VideoPreview';
import { VoiceRecordingOverlay } from './voiceRecording/VoiceRecordingOverlay';

export function OverlayHost() {
  return (
    <>
      <ImagePreview />
      <VideoPlayerOverlay />
      <VideoPreview />
      <Dialog />
      <TextInputDialog />
      <NotebookPicker />
      <IdentityPicker />
      <ActionSheet />
      <LongPressMenu />
      <VoiceRecordingOverlay />
      <LoadingToast />
      <SuccessToast />
      <TopTips />
    </>
  );
}
