import { collectInboxUrls } from "./markdown";
import { getMergedDocument } from "./merged-document";

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
  const urls = collectInboxUrls(await getMergedDocument());
  return new Set(urls.map(normalizeInboxUrl));
}

export async function isDisplayedInboxUrl(url: string): Promise<boolean> {
  return (await getDisplayedInboxUrlKeys()).has(normalizeInboxUrl(url));
}
