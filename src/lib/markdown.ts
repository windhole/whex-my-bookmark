import { DEFAULT_AREA_NAMES, SAVE_SLOT_COUNT } from "./areas";

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
      currentArea = { type: "area", title: DEFAULT_AREA_NAMES[0], children: [] };
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

export function ensureEightAreas(doc: BookmarkDocument): BookmarkDocument {
  const areas = doc.areas.map(cloneArea);
  for (let i = areas.length; i < SAVE_SLOT_COUNT; i++) {
    areas.push({
      type: "area",
      title: DEFAULT_AREA_NAMES[i],
      children: [],
    });
  }
  return { areas };
}

export function saveSlots(doc: BookmarkDocument): AreaNode[] {
  return ensureEightAreas(doc).areas.slice(0, SAVE_SLOT_COUNT);
}

export function appendBookmark(
  doc: BookmarkDocument,
  areaIndex: number,
  entry: Pick<BookmarkEntry, "title" | "url" | "annotation">,
): BookmarkDocument {
  if (areaIndex < 0 || areaIndex >= SAVE_SLOT_COUNT) {
    throw new Error(`areaIndex must be 0..${SAVE_SLOT_COUNT - 1}`);
  }
  const ensured = ensureEightAreas(doc);
  const bookmark: BookmarkEntry = {
    type: "bookmark",
    title: sanitizeTitle(entry.title),
    url: sanitizeUrl(entry.url),
    annotation: entry.annotation.trim(),
  };
  return {
    areas: ensured.areas.map((area, i) =>
      i === areaIndex
        ? { ...area, children: [...area.children, bookmark] }
        : area,
    ),
  };
}

export function serializeMarkdown(doc: BookmarkDocument): string {
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

export function defaultMarkdown(): string {
  return serializeMarkdown({
    areas: DEFAULT_AREA_NAMES.map((title) => ({
      type: "area",
      title,
      children: [],
    })),
  });
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
