import { describe, expect, it } from "vitest";
import { INBOX_TITLE } from "./areas";
import {
  makeBookmark,
  mergeInbox,
  parseMarkdown,
  serializeMarkdown,
} from "./markdown";

describe("parseMarkdown", () => {
  it("parses areas, nested folders, bookmarks, and indented annotations", () => {
    const doc = parseMarkdown(`# Wiki

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
    expect(doc.areas[0].title).toBe("Wiki");
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
  });

  it("treats same-line trailing text as annotation", () => {
    const doc = parseMarkdown(`# Wiki
- [A](https://a.example) note here
`);
    expect(doc.areas[0].children[0]).toMatchObject({
      annotation: "note here",
    });
  });

  it("creates an inbox area when bookmarks appear before any H1", () => {
    const doc = parseMarkdown(`- [Loose](https://loose.example)
`);
    expect(doc.areas[0].title).toBe(INBOX_TITLE);
    expect(doc.areas[0].children[0]).toMatchObject({ title: "Loose" });
  });
});

describe("serializeMarkdown", () => {
  it("round-trips the supported dialect", () => {
    const src = `# Wiki

- [Example](https://example.com)
  keep me

## Sub

- [Nested](https://example.org)

# Later
`;
    const again = serializeMarkdown(parseMarkdown(src));
    expect(parseMarkdown(again)).toEqual(parseMarkdown(src));
  });

  it("serializes an empty document as empty string", () => {
    expect(serializeMarkdown({ areas: [] })).toBe("");
  });
});

describe("mergeInbox", () => {
  it("creates # inbox at the top when the library has no inbox heading", () => {
    const merged = mergeInbox(parseMarkdown("# Wiki\n"), [
      makeBookmark({
        title: "Saved",
        url: "https://saved.example",
        annotation: "",
      }),
    ]);
    expect(merged.areas[0].title).toBe("inbox");
    expect(merged.areas[1].title).toBe("Wiki");
    expect(merged.areas[0].children[0]).toMatchObject({
      title: "Saved",
      url: "https://saved.example",
    });
    expect(serializeMarkdown(merged)).toMatch(/^# inbox/m);
  });

  it("appends to an existing inbox heading and normalizes the title", () => {
    const merged = mergeInbox(
      parseMarkdown(`# Inbox

- [Old](https://old.example)

# Wiki
`),
      [
        makeBookmark({
          title: "New",
          url: "https://new.example",
          annotation: "note",
        }),
      ],
    );
    expect(merged.areas[0].title).toBe("inbox");
    expect(merged.areas[0].children).toHaveLength(2);
    expect(merged.areas[0].children[1]).toMatchObject({
      title: "New",
      annotation: "note",
    });
    expect(merged.areas[1].title).toBe("Wiki");
  });
});
