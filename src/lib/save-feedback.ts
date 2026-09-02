import { refreshInboxBadge } from "./badge";
import type { SaveFailureReason } from "./save";

const SAVE_ERROR_RESET_MS = 4000;
const DUPLICATE_ERROR_RESET_MS = 1200;
const NOTIFICATION_ICON = "src/icons/icon128.png";

let badgeErrorResetTimer: ReturnType<typeof setTimeout> | undefined;

export function saveErrorMessage(reason: SaveFailureReason): string {
  switch (reason) {
    case "unsavable":
      return "This page cannot be saved to inbox.";
    case "no-tab":
      return "No active tab to save.";
    case "duplicate":
      return "This URL is already in inbox.";
    case "failed":
      return "Could not save to inbox.";
  }
}

async function flashBadgeError(resetMs: number): Promise<void> {
  await refreshInboxBadge("error");
  if (badgeErrorResetTimer !== undefined) {
    clearTimeout(badgeErrorResetTimer);
  }
  badgeErrorResetTimer = setTimeout(() => {
    void refreshInboxBadge("ok");
    badgeErrorResetTimer = undefined;
  }, resetMs);
}

export async function notifySaveError(reason: SaveFailureReason): Promise<void> {
  if (reason === "duplicate") {
    await notifyDuplicateInbox();
    return;
  }
  await chrome.notifications.create(`save-error-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON),
    title: "My Bookmark",
    message: saveErrorMessage(reason),
  });
  await flashBadgeError(SAVE_ERROR_RESET_MS);
}

export async function notifyDuplicateInbox(): Promise<void> {
  await flashBadgeError(DUPLICATE_ERROR_RESET_MS);
}
