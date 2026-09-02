import { makeBookmark } from "./markdown";
import { appendInbox } from "./storage";
import { canSaveUrl, getActiveTabRaw, pageFromTab } from "./tabs";

export type SaveFailureReason = "no-tab" | "unsavable" | "failed";

export type SaveResult =
  | { ok: true; title: string; inboxCount: number }
  | { ok: false; reason: SaveFailureReason };

export async function saveCurrentPageToInbox(): Promise<SaveResult> {
  const tab = await getActiveTabRaw();
  const page = pageFromTab(tab);
  if (!page) {
    const url = tab?.url || tab?.pendingUrl;
    if (url && !canSaveUrl(url)) {
      return { ok: false, reason: "unsavable" };
    }
    return { ok: false, reason: "no-tab" };
  }
  try {
    const inboxCount = await appendInbox(
      makeBookmark({
        title: page.title,
        url: page.url,
        annotation: "",
      }),
    );
    return { ok: true, title: page.title, inboxCount };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
