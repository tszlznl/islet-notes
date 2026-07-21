import { createContext, useContext } from 'react';

export interface ReplyDraftContextValue {
  replyToEntryId: string | undefined;
  setReplyToEntryId: (entryId: string | undefined) => void;
}

/** 聊天页引用草稿：长按菜单写入，输入区展示并随发送清除；日历页等无 Provider 的场景为 undefined。 */
export const ReplyDraftContext = createContext<ReplyDraftContextValue | undefined>(undefined);

export function useReplyDraft(): ReplyDraftContextValue | undefined {
  return useContext(ReplyDraftContext);
}
