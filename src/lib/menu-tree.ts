import type { AreaNode, TreeNode } from "./markdown";

export type MenuLink = {
  kind: "link";
  title: string;
  url: string;
};

export type MenuFolder = {
  kind: "folder";
  title: string;
  children: MenuNode[];
};

export type MenuNode = MenuFolder | MenuLink;

/** Chrome nested contextMenus are shallow; keep the deepest item at this depth (1-based). */
export const MAX_MENU_DEPTH = 5;

export function areasToPageMenu(areas: AreaNode[]): MenuFolder {
  return {
    kind: "folder",
    title: "My Bookmark",
    children: convertNodes(areasAsFolders(areas), 2, MAX_MENU_DEPTH, ""),
  };
}

export function areasToActionMenu(areas: AreaNode[]): MenuNode[] {
  return convertNodes(areasAsFolders(areas), 1, MAX_MENU_DEPTH, "");
}

function areasAsFolders(areas: AreaNode[]): TreeNode[] {
  return areas.map((area) => ({
    type: "folder" as const,
    title: area.title,
    level: 1,
    children: area.children,
  }));
}

function convertNodes(
  nodes: TreeNode[],
  depth: number,
  maxDepth: number,
  prefix: string,
): MenuNode[] {
  const out: MenuNode[] = [];
  for (const node of nodes) {
    if (node.type === "bookmark") {
      out.push({
        kind: "link",
        title: truncate(`${prefix}${node.title}`),
        url: node.url,
      });
      continue;
    }
    if (depth >= maxDepth) {
      out.push(
        ...convertNodes(
          node.children,
          depth,
          maxDepth,
          `${prefix}${node.title} / `,
        ),
      );
      continue;
    }
    out.push({
      kind: "folder",
      title: truncate(`${prefix}${node.title}`),
      children: convertNodes(node.children, depth + 1, maxDepth, ""),
    });
  }
  return out;
}

function truncate(title: string): string {
  if (title.length <= 64) return title;
  return `${title.slice(0, 61)}...`;
}
