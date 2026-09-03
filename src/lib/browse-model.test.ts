import { describe, expect, it } from "vitest";
import {
  filterFlatBookmarks,
  flattenBookmarks,
  groupByArea,
} from "./browse-model";
import { parseMarkdown } from "./markdown";

describe("flattenBookmarks", () => {
  it("keeps area and folder path for each bookmark", () => {
    const doc = parseMarkdown(`# Wiki

## Docs

- [Guide](https://guide.example)
  note

# inbox

- [Saved](https://saved.example)
`);
    expect(flattenBookmarks(doc.areas)).toEqual([
      {
        title: "Guide",
        url: "https://guide.example",
        annotation: "note",
        area: "Wiki",
        path: ["Docs"],
      },
      {
        title: "Saved",
        url: "https://saved.example",
        annotation: "",
        area: "inbox",
        path: [],
      },
    ]);
  });
});

describe("filterFlatBookmarks", () => {
  const items = flattenBookmarks(
    parseMarkdown(`# Wiki

- [Chrome Docs](https://developer.chrome.com)
`).areas,
  );

  it("matches title, url, area, and annotation", () => {
    expect(filterFlatBookmarks(items, "chrome")).toHaveLength(1);
    expect(filterFlatBookmarks(items, "wiki")).toHaveLength(1);
    expect(filterFlatBookmarks(items, "missing")).toHaveLength(0);
  });
});

describe("groupByArea", () => {
  it("preserves area order from the flat list", () => {
    const items = flattenBookmarks(
      parseMarkdown(`# inbox

- [A](https://a.example)

# Wiki

- [B](https://b.example)
`).areas,
    );
    expect([...groupByArea(items).keys()]).toEqual(["inbox", "Wiki"]);
  });
});
