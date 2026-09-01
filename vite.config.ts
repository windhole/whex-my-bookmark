import { crx } from "@crxjs/vite-plugin";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const bookmarksPath = path.join(root, "data", "bookmarks.md");

const manifest = JSON.parse(
  readFileSync(new URL("./src/manifest.json", import.meta.url), "utf8"),
);

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

export default defineConfig({
  plugins: [
    defaultLibraryPlugin(),
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
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
