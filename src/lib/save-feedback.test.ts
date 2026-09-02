import { describe, expect, it } from "vitest";
import { saveErrorMessage } from "./save-feedback";

describe("saveErrorMessage", () => {
  it("maps each failure reason to a user-facing message", () => {
    expect(saveErrorMessage("no-tab")).toBe("No active tab to save.");
    expect(saveErrorMessage("unsavable")).toBe(
      "This page cannot be saved to inbox.",
    );
    expect(saveErrorMessage("failed")).toBe("Could not save to inbox.");
    expect(saveErrorMessage("duplicate")).toBe("This URL is already in inbox.");
  });
});
