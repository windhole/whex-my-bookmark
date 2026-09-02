import { describe, expect, it } from "vitest";
import { formatInboxBadgeText } from "./badge";

describe("formatInboxBadgeText", () => {
  it("returns an empty string for zero items", () => {
    expect(formatInboxBadgeText(0)).toBe("");
  });

  it("returns the inbox count as a string", () => {
    expect(formatInboxBadgeText(3)).toBe("3");
  });
});
