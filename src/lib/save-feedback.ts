import { refreshInboxBadge } from "./badge";
import type { SaveFailureReason } from "./save";

const ERROR_RESET_MS = 4000;
const NOTIFICATION_ICON = "src/icons/icon128.png";

let errorResetTimer: ReturnType<typeof setTimeout> | undefined;

export function saveErrorMessage(reason: SaveFailureReason): string {
  switch (reason) {
    case "unsavable":
      return "This page cannot be saved to inbox.";
    case "no-tab":
      return "No active tab to save.";
    case "failed":
      return "Could not save to inbox.";
  }
}

export async function notifySaveError(reason: SaveFailureReason): Promise<void> {
  await chrome.notifications.create(`save-error-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON),
    title: "My Bookmark",
    message: saveErrorMessage(reason),
  });
  await refreshInboxBadge("error");
  if (errorResetTimer !== undefined) {
    clearTimeout(errorResetTimer);
  }
  errorResetTimer = setTimeout(() => {
    void refreshInboxBadge("ok");
    errorResetTimer = undefined;
  }, ERROR_RESET_MS);
}
