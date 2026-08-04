// @ts-check
import { SITE } from "./src/config";
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import mermaid from "astro-mermaid";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import sitemap from "@astrojs/sitemap";

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
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "kanagawa-dragon",
      },
      defaultColor: "light",
      wrap: true,
    },
  },

  integrations: [
    sitemap(),
    mermaid({
      theme: "forest",
      autoTheme: true,
    }),
  ],
});
