// @ts-check
import { SITE } from "./src/config";
import { defineConfig } from "astro/config";

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
    shikiConfig: {
      theme: "kanagawa-dragon",
      wrap: true,
    },
  },
});
