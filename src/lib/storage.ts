import { DEFAULT_LIBRARY_MARKDOWN } from "virtual:default-library";
import type { BookmarkEntry } from "./markdown";

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
  return value.filter(isBookmarkEntry);
}

export async function appendInbox(entry: BookmarkEntry): Promise<number> {
  const inbox = await getInbox();
  inbox.push(entry);
  await chrome.storage.local.set({ [INBOX_STORAGE_KEY]: inbox });
  return inbox.length;
}

export async function getInboxCount(): Promise<number> {
  return (await getInbox()).length;
}

export async function clearInbox(): Promise<void> {
  await chrome.storage.local.set({ [INBOX_STORAGE_KEY]: [] });
}

function isBookmarkEntry(value: unknown): value is BookmarkEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as BookmarkEntry;
  return (
    entry.type === "bookmark" &&
    typeof entry.title === "string" &&
    typeof entry.url === "string" &&
    typeof entry.annotation === "string"
  );
}
