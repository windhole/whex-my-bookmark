import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  local: new Map<string, unknown>(),
  tabs: [] as { url?: string; title?: string }[],
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
  tabs: {
    query: async () => state.tabs,
  },
});

import { parseMarkdown } from "./markdown";
import { saveActiveTabToArea } from "./save";
import { MARKDOWN_STORAGE_KEY } from "./storage";

describe("saveActiveTabToArea", () => {
  beforeEach(() => {
    state.local.clear();
    state.tabs.length = 0;
  });

  it("appends the active tab under the chosen H1", async () => {
    state.tabs.push({
      url: "https://example.com/page",
      title: "Example Page",
    });
    const result = await saveActiveTabToArea(0, "read later");
    expect(result).toMatchObject({ ok: true, areaTitle: "Inbox" });
    const markdown = state.local.get(MARKDOWN_STORAGE_KEY);
    expect(typeof markdown).toBe("string");
    const doc = parseMarkdown(markdown as string);
    expect(doc.areas[0].children.at(-1)).toEqual({
      type: "bookmark",
      title: "Example Page",
      url: "https://example.com/page",
      annotation: "read later",
    });
  });

  it("refuses chrome:// tabs", async () => {
    state.tabs.push({ url: "chrome://extensions", title: "Extensions" });
    const result = await saveActiveTabToArea(0, "");
    expect(result).toEqual({ ok: false, reason: "unsavable" });
  });
});
