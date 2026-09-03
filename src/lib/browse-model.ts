import type { AreaNode, BookmarkEntry, TreeNode } from "./markdown";

export type FlatBookmark = {
  title: string;
  url: string;
  annotation: string;
  area: string;
  path: string[];
};

export function flattenBookmarks(areas: AreaNode[]): FlatBookmark[] {
  const out: FlatBookmark[] = [];
  for (const area of areas) {
    walk(area.children, area.title, [], out);
  }
  return out;
}

function walk(
  nodes: TreeNode[],
  area: string,
  path: string[],
  out: FlatBookmark[],
): void {
  for (const node of nodes) {
    if (node.type === "bookmark") {
      out.push(bookmarkToFlat(node, area, path));
      continue;
    }
    walk(node.children, area, [...path, node.title], out);
  }
}

function bookmarkToFlat(
  entry: BookmarkEntry,
  area: string,
  path: string[],
): FlatBookmark {
  return {
    title: entry.title,
    url: entry.url,
    annotation: entry.annotation,
    area,
    path,
  };
}

export function filterFlatBookmarks(
  items: FlatBookmark[],
  query: string,
): FlatBookmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.title,
      item.url,
      item.annotation,
      item.area,
      ...item.path,
    ]
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function groupByArea(items: FlatBookmark[]): Map<string, FlatBookmark[]> {
  const groups = new Map<string, FlatBookmark[]>();
  for (const item of items) {
    const list = groups.get(item.area) ?? [];
    list.push(item);
    groups.set(item.area, list);
  }
  return groups;
}
