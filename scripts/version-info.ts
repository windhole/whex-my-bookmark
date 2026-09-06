import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildVersionInfo, type AppVersionInfo } from "../src/lib/version-format";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export type { AppVersionInfo };

export function readPackageVersion(
  packageJsonPath = path.join(root, "package.json"),
): string {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: string;
  };
  if (typeof pkg.version !== "string" || pkg.version.trim() === "") {
    throw new Error("package.json is missing a version");
  }
  return pkg.version;
}

export function readGitShortSha(cwd = root): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export function resolveVersionInfo(): AppVersionInfo {
  return buildVersionInfo(readPackageVersion(), readGitShortSha());
}
