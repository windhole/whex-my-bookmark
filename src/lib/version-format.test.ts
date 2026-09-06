import { describe, expect, it } from "vitest";
import { buildVersionInfo } from "./version-format";

describe("buildVersionInfo", () => {
  it("formats version_name with the git sha", () => {
    expect(buildVersionInfo("0.2.0", "abc1234")).toEqual({
      version: "0.2.0",
      gitSha: "abc1234",
      versionName: "0.2.0 (abc1234)",
    });
  });
});
