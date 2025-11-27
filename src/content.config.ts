import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const note = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional().default(false),
    publishedAt: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

const c = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/c" }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.date(),
  }),
});

export const collections = { note, c };
