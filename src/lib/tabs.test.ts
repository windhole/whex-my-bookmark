import { describe, expect, it } from "vitest";
import { canSaveUrl } from "./tabs";

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
