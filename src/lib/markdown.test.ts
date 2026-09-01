import { describe, expect, it } from "vitest";
import {
  appendBookmark,
  defaultMarkdown,
  ensureEightAreas,
  parseMarkdown,
  saveSlots,
  serializeMarkdown,
} from "./markdown";

describe("parseMarkdown", () => {
  it("parses areas, nested folders, bookmarks, and indented annotations", () => {
    const doc = parseMarkdown(`# Inbox

- [Example](https://example.com)
  First line
  Second line

## Subfolder

- [Nested](https://example.org)

### Deep

- [Deep link](https://example.net)

## Sibling

- [Other](https://example.io)

# Later
`);

    expect(doc.areas).toHaveLength(2);
    expect(doc.areas[0].title).toBe("Inbox");
    expect(doc.areas[0].children[0]).toEqual({
      type: "bookmark",
      title: "Example",
      url: "https://example.com",
      annotation: "First line\nSecond line",
    });
    const sub = doc.areas[0].children[1];
    expect(sub.type).toBe("folder");
    if (sub.type !== "folder") return;
    expect(sub.title).toBe("Subfolder");
    expect(sub.children[0]).toMatchObject({
      type: "bookmark",
      title: "Nested",
    });
    const deep = sub.children[1];
    expect(deep.type).toBe("folder");
    if (deep.type !== "folder") return;
    expect(deep.level).toBe(3);
    expect(deep.children[0]).toMatchObject({ title: "Deep link" });
    expect(doc.areas[1].title).toBe("Later");
    expect(doc.areas[1].children).toEqual([]);
  });

  it("treats same-line trailing text as annotation", () => {
    const doc = parseMarkdown(`# Inbox
- [A](https://a.example) note here
`);
    expect(doc.areas[0].children[0]).toMatchObject({
      annotation: "note here",
    });
  });

  it("creates a default area when bookmarks appear before any H1", () => {
    const doc = parseMarkdown(`- [Loose](https://loose.example)
`);
    expect(doc.areas[0].title).toBe("Inbox");
    expect(doc.areas[0].children[0]).toMatchObject({ title: "Loose" });
  });
});

describe("ensureEightAreas / saveSlots", () => {
  it("pads missing H1s with default names and keeps extras", () => {
    const padded = ensureEightAreas(parseMarkdown("# Inbox\n\n# Later\n"));
    expect(padded.areas).toHaveLength(8);
    expect(padded.areas.map((a) => a.title)).toEqual([
      "Inbox",
      "Later",
      "Reading",
      "Reference",
      "Work",
      "Personal",
      "Archive",
      "Misc",
    ]);

    const extras = ensureEightAreas(
      parseMarkdown("# A\n# B\n# C\n# D\n# E\n# F\n# G\n# H\n# Extra\n"),
    );
    expect(extras.areas).toHaveLength(9);
    expect(saveSlots(extras)).toHaveLength(8);
    expect(extras.areas[8].title).toBe("Extra");
  });
});

describe("serializeMarkdown", () => {
  it("round-trips the supported dialect", () => {
    const src = `# Inbox

- [Example](https://example.com)
  keep me

## Sub

- [Nested](https://example.org)

# Later
`;
    const again = serializeMarkdown(parseMarkdown(src));
    expect(parseMarkdown(again)).toEqual(parseMarkdown(src));
    expect(again).toContain("# Inbox");
    expect(again).toContain("  keep me");
  });

  it("emits the eight default areas", () => {
    const md = defaultMarkdown();
    const doc = parseMarkdown(md);
    expect(doc.areas).toHaveLength(8);
    expect(doc.areas[0].title).toBe("Inbox");
    expect(doc.areas[7].title).toBe("Misc");
  });
});

describe("appendBookmark", () => {
  it("appends at the end of the chosen H1 section, after folders", () => {
    const doc = parseMarkdown(`# Inbox

- [Old](https://old.example)

## Sub

- [Nested](https://nested.example)

# Later
`);
    const next = appendBookmark(doc, 0, {
      title: "New",
      url: "https://new.example",
      annotation: "from popup",
    });
    const last = next.areas[0].children.at(-1);
    expect(last).toEqual({
      type: "bookmark",
      title: "New",
      url: "https://new.example",
      annotation: "from popup",
    });
    expect(next.areas[0].children).toHaveLength(3);
    expect(serializeMarkdown(next)).toMatch(/## Sub[\s\S]*- \[New\]/);
  });

  it("pads to eight areas when saving to a later slot", () => {
    const next = appendBookmark(parseMarkdown("# Inbox\n"), 2, {
      title: "Read this",
      url: "https://reading.example",
      annotation: "",
    });
    expect(next.areas).toHaveLength(8);
    expect(next.areas[2].title).toBe("Reading");
    expect(next.areas[2].children[0]).toMatchObject({
      title: "Read this",
    });
  });
});
