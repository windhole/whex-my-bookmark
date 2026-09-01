import { describe, expect, it } from "vitest";
import { exportFilename } from "./export-filename";

describe("exportFilename", () => {
  it("uses local date and time as YYYYMMDD-HHmm", () => {
    const now = new Date(2026, 8, 1, 22, 54, 30);
    expect(exportFilename(now)).toBe("bookmarks_20260901-2254.md");
  });
});
