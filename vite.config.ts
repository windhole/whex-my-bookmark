import { crx } from "@crxjs/vite-plugin";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const manifest = JSON.parse(
  readFileSync(new URL("./src/manifest.json", import.meta.url), "utf8"),
);

export default defineConfig({
  plugins: [
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
