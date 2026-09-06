import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("package.json の version が semver (x.y.z) ではありません:", version);
  process.exit(1);
}

let gitSha = "unknown";
try {
  gitSha = execSync("git rev-parse --short HEAD", {
    cwd: root,
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf8",
  }).trim();
} catch {
  // keep unknown
}

const [major, minor, patch] = version.split(".").map(Number);
console.log(`現在: ${version} (${gitSha})`);

const builtManifest = path.join(root, "dist/chrome/manifest.json");
if (existsSync(builtManifest)) {
  const built = JSON.parse(readFileSync(builtManifest, "utf8"));
  console.log(`ビルド済み: ${built.version_name || built.version}`);
} else {
  console.log("ビルド済み: （dist/chrome なし）");
}

console.log(`次の patch: ${major}.${minor}.${patch + 1}`);
console.log(`次の minor: ${major}.${minor + 1}.0`);
console.log(`次の major: ${major + 1}.0.0`);
