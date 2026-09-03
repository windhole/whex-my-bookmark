import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  local: new Map<string, unknown>(),
}));

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: async (key: string) => ({ [key]: state.local.get(key) }),
      set: async (items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) {
          state.local.set(k, v);
        }
      },
    },
  },
});

import { mergeInbox, parseMarkdown } from "./markdown";
import { getMergedDocument } from "./merged-document";
import { INBOX_STORAGE_KEY, MARKDOWN_STORAGE_KEY } from "./storage";

describe("getMergedDocument", () => {
  beforeEach(() => {
    state.local.clear();
  });

  it("matches export merge of library markdown and inbox entries", async () => {
    state.local.set(MARKDOWN_STORAGE_KEY, "# Wiki\n\n- [Docs](https://docs.example)\n");
    state.local.set(INBOX_STORAGE_KEY, [
      {
        type: "bookmark",
        title: "Saved",
        url: "https://saved.example",
        annotation: "",
      },
    ]);
    const doc = await getMergedDocument();
    const expected = mergeInbox(
      parseMarkdown("# Wiki\n\n- [Docs](https://docs.example)\n"),
      [
        {
          type: "bookmark",
          title: "Saved",
          url: "https://saved.example",
          annotation: "",
        },
      ],
    );
    expect(doc).toEqual(expected);
  });
});
