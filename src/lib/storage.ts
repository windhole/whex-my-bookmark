import { DEFAULT_LIBRARY_MARKDOWN } from "virtual:default-library";
import { makeBookmark, type BookmarkEntry } from "./markdown";

export const MARKDOWN_STORAGE_KEY = "bookmarkMarkdown";
export const INBOX_STORAGE_KEY = "inboxEntries";

export async function getMarkdown(): Promise<string> {
  const result = await chrome.storage.local.get(MARKDOWN_STORAGE_KEY);
  const value = result[MARKDOWN_STORAGE_KEY];
  return typeof value === "string" ? value : "";
}

export async function setMarkdown(markdown: string): Promise<void> {
  await chrome.storage.local.set({ [MARKDOWN_STORAGE_KEY]: markdown });
}

export async function ensureLibrary(
  bundledMarkdown = DEFAULT_LIBRARY_MARKDOWN,
): Promise<string> {
  const result = await chrome.storage.local.get(MARKDOWN_STORAGE_KEY);
  const value = result[MARKDOWN_STORAGE_KEY];
  if (typeof value === "string") {
    return value;
  }
  if (bundledMarkdown.trim() !== "") {
    await setMarkdown(bundledMarkdown);
    return bundledMarkdown;
  }
  return "";
}

export async function getInbox(): Promise<BookmarkEntry[]> {
  const result = await chrome.storage.local.get(INBOX_STORAGE_KEY);
  const value = result[INBOX_STORAGE_KEY];
  if (!Array.isArray(value)) return [];
  const inbox: BookmarkEntry[] = [];
  for (const item of value) {
    const normalized = normalizeBookmarkEntry(item);
    if (normalized) inbox.push(normalized);
  }
  return inbox;
}

export async function appendInbox(entry: BookmarkEntry): Promise<number> {
  const inbox = await getInbox();
  inbox.push(entry);
  await chrome.storage.local.set({ [INBOX_STORAGE_KEY]: inbox });
  return inbox.length;
}

export async function clearInbox(): Promise<void> {
  await chrome.storage.local.set({ [INBOX_STORAGE_KEY]: [] });
}

function normalizeBookmarkEntry(value: unknown): BookmarkEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.url !== "string" || entry.url.trim() === "") return null;
  const title =
    typeof entry.title === "string" && entry.title.trim() !== ""
      ? entry.title
      : entry.url;
  const annotation =
    typeof entry.annotation === "string" ? entry.annotation : "";
  return makeBookmark({ title, url: entry.url, annotation });
}
