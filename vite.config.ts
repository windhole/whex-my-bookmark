import { crx } from "@crxjs/vite-plugin";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { resolveVersionInfo } from "./scripts/version-info";

const root = path.dirname(fileURLToPath(import.meta.url));
const bookmarksPath = path.join(root, "data", "bookmarks.md");
const { version, gitSha, versionName } = resolveVersionInfo();

const manifest = {
  ...JSON.parse(
    readFileSync(new URL("./src/manifest.json", import.meta.url), "utf8"),
  ),
  version,
  version_name: versionName,
};

function defaultLibraryPlugin(): Plugin {
  const virtual = "virtual:default-library";
  const resolved = `\0${virtual}`;
  return {
    name: "default-library",
    resolveId(id) {
      if (id === virtual) return resolved;
    },
    load(id) {
      if (id !== resolved) return;
      const text = existsSync(bookmarksPath)
        ? readFileSync(bookmarksPath, "utf8")
        : "";
      return `export const DEFAULT_LIBRARY_MARKDOWN = ${JSON.stringify(text)};`;
    },
  };
}

function appVersionPlugin(): Plugin {
  const virtual = "virtual:app-version";
  const resolved = `\0${virtual}`;
  return {
    name: "app-version",
    resolveId(id) {
      if (id === virtual) return resolved;
    },
    load(id) {
      if (id !== resolved) return;
      return `export const APP_VERSION = ${JSON.stringify(version)};
export const APP_GIT_SHA = ${JSON.stringify(gitSha)};
export const APP_VERSION_NAME = ${JSON.stringify(versionName)};
`;
    },
  };
}

export default defineConfig({
  plugins: [
    defaultLibraryPlugin(),
    appVersionPlugin(),
    {
      name: "strip-crossorigin",
      enforce: "post",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          return html.replaceAll(" crossorigin", "");
        },
      },
    },
    crx({ manifest }),
  ],
  build: {
    outDir: "dist/chrome",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: {
        browse: path.resolve(root, "src/browse/index.html"),
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
