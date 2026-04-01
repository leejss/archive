// @ts-check
import { SITE } from "./src/config";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: SITE.baseURL,
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: "kanagawa-dragon",
      wrap: true,
    },
  },

  integrations: [
    mermaid({
      theme: "forest",
      autoTheme: true,
    }),
  ],
});
