import { describe, expect, it } from "vitest";
import { canSaveUrl, pageFromTab } from "./tabs";

describe("canSaveUrl", () => {
  it("allows http(s) pages", () => {
    expect(canSaveUrl("https://example.com/path")).toBe(true);
    expect(canSaveUrl("http://localhost:5173")).toBe(true);
  });

  it("rejects browser-internal pages", () => {
    expect(canSaveUrl("chrome://extensions")).toBe(false);
    expect(canSaveUrl("chrome-extension://abc/popup.html")).toBe(false);
    expect(canSaveUrl("about:blank")).toBe(false);
    expect(canSaveUrl(undefined)).toBe(false);
  });
});

describe("pageFromTab", () => {
  it("uses pendingUrl while the tab is still loading", () => {
    expect(
      pageFromTab({
        pendingUrl: "https://example.com/loading",
        title: "Loading",
      } as chrome.tabs.Tab),
    ).toEqual({
      url: "https://example.com/loading",
      title: "Loading",
    });
  });

  it("ignores unsavable tabs", () => {
    expect(
      pageFromTab({
        url: "chrome://newtab",
        title: "New Tab",
      } as chrome.tabs.Tab),
    ).toBeUndefined();
  });
});
