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

import { MARKDOWN_STORAGE_KEY, INBOX_STORAGE_KEY, ensureLibrary, getInbox, getMarkdown } from "./storage";

describe("ensureLibrary", () => {
  beforeEach(() => {
    state.local.clear();
  });

  it("seeds storage from bundled markdown when the library key is missing", async () => {
    const bundled = "# Wiki\n\n- [Docs](https://example.com)\n";
    const result = await ensureLibrary(bundled);
    expect(result).toBe(bundled);
    expect(state.local.get(MARKDOWN_STORAGE_KEY)).toBe(bundled);
    expect(await getMarkdown()).toBe(bundled);
  });

  it("does not overwrite an already imported library", async () => {
    state.local.set(MARKDOWN_STORAGE_KEY, "# Existing\n");
    const result = await ensureLibrary("# Bundled\n");
    expect(result).toBe("# Existing\n");
  });

  it("leaves storage empty when there is no bundled file", async () => {
    const result = await ensureLibrary("  \n");
    expect(result).toBe("");
    expect(state.local.has(MARKDOWN_STORAGE_KEY)).toBe(false);
  });
});

describe("getInbox", () => {
  beforeEach(() => {
    state.local.clear();
  });

  it("normalizes legacy entries missing type or annotation", async () => {
    state.local.set(INBOX_STORAGE_KEY, [
      { title: "Old", url: "https://old.example" },
      {
        title: "Legacy",
        url: "https://legacy.example",
        annotation: "note",
      },
    ]);
    expect(await getInbox()).toEqual([
      {
        type: "bookmark",
        title: "Old",
        url: "https://old.example",
        annotation: "",
      },
      {
        type: "bookmark",
        title: "Legacy",
        url: "https://legacy.example",
        annotation: "note",
      },
    ]);
  });
});
