import {
  countInboxBookmarks,
  mergeInbox,
  parseMarkdown,
} from "./markdown";
import { getInbox, getMarkdown } from "./storage";

export const BADGE_OK_COLOR = "#009E73";
export const BADGE_ERROR_COLOR = "#D55E00";

export type BadgeState = "ok" | "error";

export function formatInboxBadgeText(count: number): string {
  return count > 0 ? String(count) : "";
}

export async function syncInboxBadge(
  count: number,
  state: BadgeState = "ok",
): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({
    color: state === "error" ? BADGE_ERROR_COLOR : BADGE_OK_COLOR,
  });
  await chrome.action.setBadgeText({ text: formatInboxBadgeText(count) });
}

export async function countDisplayedInbox(): Promise<number> {
  const markdown = await getMarkdown();
  const inbox = await getInbox();
  return countInboxBookmarks(mergeInbox(parseMarkdown(markdown), inbox));
}

export async function refreshInboxBadge(
  state: BadgeState = "ok",
): Promise<void> {
  await syncInboxBadge(await countDisplayedInbox(), state);
}
