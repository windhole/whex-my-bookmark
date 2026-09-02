import { describe, expect, it } from "vitest";
import { normalizeInboxUrl } from "./inbox-urls";

describe("normalizeInboxUrl", () => {
  it("lowercases and strips trailing slashes from paths", () => {
    expect(normalizeInboxUrl("HTTPS://Example.com/path/")).toBe(
      "https://example.com/path",
    );
  });

  it("ignores URL fragments", () => {
    expect(normalizeInboxUrl("https://example.com/page#section")).toBe(
      "https://example.com/page",
    );
  });
});
