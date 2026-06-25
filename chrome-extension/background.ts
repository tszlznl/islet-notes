interface ChromeRuntime {
  onInstalled: {
    addListener(callback: () => void): void;
  };
}

interface ChromeSidePanel {
  setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
}

declare const chrome: {
  runtime: ChromeRuntime;
  sidePanel: ChromeSidePanel;
};

function enableSidePanelAction(): void {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error));
}

enableSidePanelAction();
chrome.runtime.onInstalled.addListener(enableSidePanelAction);
