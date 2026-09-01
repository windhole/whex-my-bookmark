import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./markdown";
import { MAX_MENU_DEPTH, areasToPageMenu } from "./menu-tree";

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
  it("wraps areas under a root and flattens headings that would exceed Chrome depth", () => {
    const doc = parseMarkdown(`# A
## B
### C
#### D
##### E
###### F
- [Leaf](https://leaf.example)
`);
    const menu = areasToPageMenu(doc.areas);
    expect(menu.title).toBe("My Bookmark");
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
