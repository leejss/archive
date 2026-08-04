import { getCollection, type CollectionEntry } from "astro:content";

type PublishableEntry =
  | CollectionEntry<"note">
  | CollectionEntry<"problem">;

export function isPublished(entry: PublishableEntry, now = new Date()) {
  if (import.meta.env.DEV) {
    return true;
  }

  return !entry.data.draft && entry.data.publishedAt.getTime() <= now.getTime();
}

export function byPublishedAtDescending(
  a: PublishableEntry,
  b: PublishableEntry,
) {
  return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
}

export async function getPublishedNotes() {
  const now = new Date();
  const notes = await getCollection("note", (entry) => isPublished(entry, now));

  return notes.sort(byPublishedAtDescending);
}

export async function getPublishedProblems() {
  const now = new Date();
  const problems = await getCollection("problem", (entry) =>
    isPublished(entry, now),
  );

  return problems.sort(byPublishedAtDescending);
}
