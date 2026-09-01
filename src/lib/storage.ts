import { defaultMarkdown } from "./markdown";

export const MARKDOWN_STORAGE_KEY = "bookmarkMarkdown";

export async function getMarkdown(): Promise<string | undefined> {
  const result = await chrome.storage.local.get(MARKDOWN_STORAGE_KEY);
  const value = result[MARKDOWN_STORAGE_KEY];
  return typeof value === "string" ? value : undefined;
}

export async function setMarkdown(markdown: string): Promise<void> {
  await chrome.storage.local.set({ [MARKDOWN_STORAGE_KEY]: markdown });
}

export async function ensureInitialized(): Promise<string> {
  const existing = await getMarkdown();
  if (existing !== undefined && existing.trim() !== "") {
    return existing;
  }
  const initial = defaultMarkdown();
  await setMarkdown(initial);
  return initial;
}
