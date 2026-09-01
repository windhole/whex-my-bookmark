function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local time, e.g. bookmarks_20260901-2254.md */
export function exportFilename(now = new Date()): string {
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}`;
  return `bookmarks_${date}-${time}.md`;
}
