import { createContext } from 'react';

// 当前被高亮的条目 id;为空表示没有任何条目处于高亮态。
export const EntryHighlightContext = createContext<string | undefined>(undefined);

// 触发某条 entry 高亮;用于列表内操作复用日历跳转的高亮效果。
export const EntryHighlightActionContext = createContext<((entryId: string) => void) | undefined>(
  undefined,
);
