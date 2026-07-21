import React, { type ReactNode } from 'react';
import { EntryHighlightActionContext, EntryHighlightContext } from './context';

export function EntryHighlightProvider({
  highlightedEntryId,
  triggerHighlight,
  children,
}: {
  highlightedEntryId: string | undefined;
  triggerHighlight?: (entryId: string) => void;
  children: ReactNode;
}) {
  return (
    <EntryHighlightActionContext.Provider value={triggerHighlight}>
      <EntryHighlightContext.Provider value={highlightedEntryId}>
        {children}
      </EntryHighlightContext.Provider>
    </EntryHighlightActionContext.Provider>
  );
}
