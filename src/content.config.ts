import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postSchema = z.object({
	title: z.string(),
	description: z.string().trim().min(1).optional(),
	draft: z.boolean().optional().default(false),
	publishedAt: z.date(),
	tags: z.array(z.string().trim().min(1)).optional().default([]),
	aiGenerated: z.boolean().optional().default(false),
});

const note = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
	schema: postSchema,
});

const problemSchema = postSchema.extend({
	source: z.string(),
	url: z.url(),
});

const problem = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/problems" }),
	schema: problemSchema,
});

export const collections = { note, problem };
