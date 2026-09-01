import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./markdown";
import { MAX_MENU_DEPTH, areasToActionMenu, areasToPageMenu } from "./menu-tree";

function maxDepth(node: { kind: string; children?: unknown[] }, d = 1): number {
  if (node.kind !== "folder" || !node.children?.length) return d;
  return Math.max(
    d,
    ...(node.children as { kind: string; children?: unknown[] }[]).map((c) =>
      maxDepth(c, d + 1),
    ),
  );
}

describe("areasToPageMenu", () => {
  it("wraps H1s under a root and flattens headings past Chrome depth", () => {
    const doc = parseMarkdown(`# Library
## A
### B
#### C
##### D
###### E
- [Leaf](https://leaf.example)
`);
    const menu = areasToPageMenu(doc.areas);
    expect(menu.title).toBe("My Bookmark");
    expect(menu.children[0]).toMatchObject({
      kind: "folder",
      title: "Library",
    });
    expect(maxDepth(menu)).toBeLessThanOrEqual(MAX_MENU_DEPTH);
    const serialized: string[] = [];
    const walk = (n: { kind: string; title?: string; children?: unknown[] }) => {
      if (n.kind === "link") serialized.push(n.title ?? "");
      for (const c of n.children ?? []) {
        walk(c as { kind: string; title?: string; children?: unknown[] });
      }
    };
    walk(menu);
    expect(serialized.some((t) => t.includes("Leaf"))).toBe(true);
  });
});

describe("areasToActionMenu", () => {
  it("puts H1s at the toolbar menu root", () => {
    const menu = areasToActionMenu(parseMarkdown("# inbox\n# Wiki\n").areas);
    expect(menu.map((item) => item.title)).toEqual(["inbox", "Wiki"]);
  });
});
