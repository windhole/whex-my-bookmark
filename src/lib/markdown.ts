import { INBOX_TITLE, isInboxTitle } from "./areas";

export type BookmarkEntry = {
  type: "bookmark";
  title: string;
  url: string;
  annotation: string;
};

export type FolderNode = {
  type: "folder";
  title: string;
  level: number;
  children: TreeNode[];
};

export type AreaNode = {
  type: "area";
  title: string;
  children: TreeNode[];
};

export type TreeNode = FolderNode | BookmarkEntry;

export type BookmarkDocument = {
  areas: AreaNode[];
};

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const BOOKMARK = /^-\s+\[([^\]]*)\]\(([^)]+)\)(?:\s+(.*))?\s*$/;
const INDENTED = /^(?: {2,}|\t)(.*)$/;

export function parseMarkdown(src: string): BookmarkDocument {
  const areas: AreaNode[] = [];
  let currentArea: AreaNode | null = null;
  const folderStack: FolderNode[] = [];
  let currentBookmark: BookmarkEntry | null = null;

  const ensureArea = (): AreaNode => {
    if (!currentArea) {
      currentArea = { type: "area", title: INBOX_TITLE, children: [] };
      areas.push(currentArea);
    }
    return currentArea;
  };

  const parentChildren = (): TreeNode[] => {
    if (folderStack.length > 0) {
      return folderStack[folderStack.length - 1].children;
    }
    return ensureArea().children;
  };

  const lines = src.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const heading = HEADING.exec(line);
    if (heading) {
      currentBookmark = null;
      const level = heading[1].length;
      const title = heading[2].replace(/\s+#+\s*$/, "").trim();
      if (level === 1) {
        currentArea = { type: "area", title, children: [] };
        areas.push(currentArea);
        folderStack.length = 0;
      } else {
        const area = ensureArea();
        while (
          folderStack.length > 0 &&
          folderStack[folderStack.length - 1].level >= level
        ) {
          folderStack.pop();
        }
        const folder: FolderNode = { type: "folder", title, level, children: [] };
        const parent =
          folderStack.length > 0
            ? folderStack[folderStack.length - 1].children
            : area.children;
        parent.push(folder);
        folderStack.push(folder);
      }
      continue;
    }

    const bookmark = BOOKMARK.exec(line);
    if (bookmark) {
      const url = bookmark[2].trim();
      const trailing = (bookmark[3] ?? "").trim();
      const entry: BookmarkEntry = {
        type: "bookmark",
        title: (bookmark[1] || url).trim() || url,
        url,
        annotation: trailing,
      };
      parentChildren().push(entry);
      currentBookmark = entry;
      continue;
    }

    const indented = INDENTED.exec(line);
    if (indented && currentBookmark) {
      const text = indented[1];
      currentBookmark.annotation = currentBookmark.annotation
        ? `${currentBookmark.annotation}\n${text}`
        : text;
      continue;
    }

    if (line.trim() === "") {
      currentBookmark = null;
    }
  }

  return { areas };
}

export function serializeMarkdown(doc: BookmarkDocument): string {
  if (doc.areas.length === 0) return "";
  const lines: string[] = [];
  for (const area of doc.areas) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(`# ${area.title}`);
    writeChildren(area.children, lines);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function makeBookmark(
  entry: Pick<BookmarkEntry, "title" | "url" | "annotation">,
): BookmarkEntry {
  return {
    type: "bookmark",
    title: sanitizeTitle(entry.title),
    url: sanitizeUrl(entry.url),
    annotation: entry.annotation.trim(),
  };
}

export function mergeInbox(
  doc: BookmarkDocument,
  entries: BookmarkEntry[],
): BookmarkDocument {
  const areas = doc.areas.map(cloneArea);
  const bookmarks = entries.map((entry) => makeBookmark(entry));
  const existing = areas.find((area) => isInboxTitle(area.title));
  if (existing) {
    existing.title = INBOX_TITLE;
    existing.children = [...existing.children, ...bookmarks];
    return { areas };
  }
  return {
    areas: [
      { type: "area", title: INBOX_TITLE, children: bookmarks },
      ...areas,
    ],
  };
}

export function countInboxBookmarks(doc: BookmarkDocument): number {
  const inboxArea = doc.areas.find((area) => isInboxTitle(area.title));
  if (!inboxArea) return 0;
  return countBookmarkNodes(inboxArea.children);
}

function countBookmarkNodes(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "bookmark") {
      count += 1;
    } else {
      count += countBookmarkNodes(node.children);
    }
  }
  return count;
}

function writeChildren(children: TreeNode[], lines: string[]): void {
  for (const child of children) {
    lines.push("");
    if (child.type === "bookmark") {
      lines.push(`- [${escapeTitle(child.title)}](${child.url})`);
      if (child.annotation) {
        for (const row of child.annotation.split("\n")) {
          lines.push(`  ${row}`);
        }
      }
    } else {
      const hashes = "#".repeat(Math.min(Math.max(child.level, 2), 6));
      lines.push(`${hashes} ${child.title}`);
      writeChildren(child.children, lines);
    }
  }
}

function cloneArea(area: AreaNode): AreaNode {
  return {
    type: "area",
    title: area.title,
    children: area.children.map(cloneNode),
  };
}

function cloneNode(node: TreeNode): TreeNode {
  if (node.type === "bookmark") {
    return { ...node };
  }
  return {
    type: "folder",
    title: node.title,
    level: node.level,
    children: node.children.map(cloneNode),
  };
}

function sanitizeTitle(title: string): string {
  return title.replace(/]/g, "").trim() || "Untitled";
}

function sanitizeUrl(url: string): string {
  return url.replace(/\)/g, "%29");
}

function escapeTitle(title: string): string {
  return title.replace(/]/g, "");
}
