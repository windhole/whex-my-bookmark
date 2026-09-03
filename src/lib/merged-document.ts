import type { BookmarkDocument } from "./markdown";
import { mergeInbox, parseMarkdown } from "./markdown";
import { ensureLibrary, getInbox, getMarkdown } from "./storage";

/** Same document shape as Export: library Markdown with inbox merged under # inbox. */
export async function getMergedDocument(
  ensure = false,
): Promise<BookmarkDocument> {
  const markdown = ensure ? await ensureLibrary() : await getMarkdown();
  const inbox = await getInbox();
  return mergeInbox(parseMarkdown(markdown), inbox);
}
