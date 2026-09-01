export const INBOX_TITLE = "inbox";

export function isInboxTitle(title: string): boolean {
  return title.trim().toLowerCase() === INBOX_TITLE;
}
