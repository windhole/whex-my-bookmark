import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  local: new Map<string, unknown>(),
  tabs: [] as { url?: string; title?: string; pendingUrl?: string }[],
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
  windows: {
    getLastFocused: async () => ({
      id: 1,
      tabs: state.tabs.map((tab, index) => ({
        ...tab,
        id: index + 1,
        active: true,
      })),
    }),
  },
  tabs: {
    query: async () =>
      state.tabs.map((tab, index) => ({
        ...tab,
        id: index + 1,
        active: true,
      })),
  },
});

import { INBOX_STORAGE_KEY } from "./storage";
import { saveCurrentPageToInbox } from "./save";

describe("saveCurrentPageToInbox", () => {
  beforeEach(() => {
    state.local.clear();
    state.tabs.length = 0;
  });

  it("appends the active tab to the inbox array", async () => {
    state.tabs.push({
      url: "https://example.com/page",
      title: "Example Page",
    });
    const result = await saveCurrentPageToInbox();
    expect(result).toMatchObject({ ok: true, title: "Example Page", inboxCount: 1 });
    expect(state.local.get(INBOX_STORAGE_KEY)).toEqual([
      {
        type: "bookmark",
        title: "Example Page",
        url: "https://example.com/page",
        annotation: "",
      },
    ]);
  });

  it("uses pendingUrl when url is still empty", async () => {
    state.tabs.push({
      pendingUrl: "https://example.com/loading",
      title: "Loading",
    });
    const result = await saveCurrentPageToInbox();
    expect(result).toMatchObject({ ok: true, inboxCount: 1 });
  });

  it("refuses chrome:// tabs", async () => {
    state.tabs.push({ url: "chrome://extensions", title: "Extensions" });
    const result = await saveCurrentPageToInbox();
    expect(result).toEqual({ ok: false, reason: "no-tab" });
  });
});
