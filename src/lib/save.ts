import { makeBookmark } from "./markdown";
import { appendInbox } from "./storage";
import { getPageToSave } from "./tabs";

export type SaveResult =
  | { ok: true; title: string; inboxCount: number }
  | { ok: false; reason: "no-tab" | "unsavable" | "failed" };

export async function saveCurrentPageToInbox(): Promise<SaveResult> {
  const page = await getPageToSave();
  if (!page) {
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
