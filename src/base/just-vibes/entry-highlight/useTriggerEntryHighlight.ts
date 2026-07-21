import { useContext } from 'react';
import { EntryHighlightActionContext } from './context';

export function useTriggerEntryHighlight(): ((entryId: string) => void) | undefined {
  return useContext(EntryHighlightActionContext);
}
