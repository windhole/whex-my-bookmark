import { collectInboxUrls, mergeInbox, parseMarkdown } from "./markdown";
import { getInbox, getMarkdown } from "./storage";

export function normalizeInboxUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

export async function getDisplayedInboxUrlKeys(): Promise<Set<string>> {
  const markdown = await getMarkdown();
  const inbox = await getInbox();
  const urls = collectInboxUrls(mergeInbox(parseMarkdown(markdown), inbox));
  return new Set(urls.map(normalizeInboxUrl));
}

export async function isDisplayedInboxUrl(url: string): Promise<boolean> {
  return (await getDisplayedInboxUrlKeys()).has(normalizeInboxUrl(url));
}
