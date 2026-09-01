import {
  appendBookmark,
  parseMarkdown,
  serializeMarkdown,
} from "./markdown";
import { ensureInitialized, setMarkdown } from "./storage";
import { canSaveUrl, getActiveTab } from "./tabs";

export type SaveResult =
  | { ok: true; title: string; areaTitle: string }
  | { ok: false; reason: "no-tab" | "unsavable" };

export async function saveActiveTabToArea(
  areaIndex: number,
  annotation: string,
): Promise<SaveResult> {
  const tab = await getActiveTab();
  if (!tab) {
    return { ok: false, reason: "no-tab" };
  }
  if (!canSaveUrl(tab.url)) {
    return { ok: false, reason: "unsavable" };
  }
  const markdown = await ensureInitialized();
  const doc = parseMarkdown(markdown);
  const next = appendBookmark(doc, areaIndex, {
    title: tab.title?.trim() || tab.url,
    url: tab.url,
    annotation,
  });
  await setMarkdown(serializeMarkdown(next));
  return {
    ok: true,
    title: tab.title?.trim() || tab.url,
    areaTitle: next.areas[areaIndex]?.title ?? `Area ${areaIndex + 1}`,
  };
}

export type RuntimeMessage =
  | { type: "SAVE_TO_AREA"; areaIndex: number; annotation?: string }
  | { type: "GET_SAVE_RESULT" };

export type SaveToAreaResponse = SaveResult;
