import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { SITE } from "@/config";
import { getPublishedNotes, getPublishedProblems } from "@/lib/content";

export const GET: APIRoute = async ({ site }) => {
  const [notes, problems] = await Promise.all([
    getPublishedNotes(),
    getPublishedProblems(),
  ]);

  const items = [
    ...notes.map((note) => ({
      title: note.data.title,
      description: note.data.description ?? SITE.description,
      pubDate: note.data.publishedAt,
      link: `/notes/${note.id}`,
      categories: note.data.tags,
    })),
    ...problems.map((problem) => ({
      title: problem.data.title,
      description:
        problem.data.description ?? `${problem.data.source} 문제 풀이`,
      pubDate: problem.data.publishedAt,
      link: `/problems/${problem.id}`,
      categories: problem.data.tags,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: site ?? SITE.baseURL,
    items,
    customData: `<language>${SITE.defaultLanguage}</language>`,
  });
};
