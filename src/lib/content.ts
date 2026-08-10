import { getCollection, type CollectionEntry } from "astro:content";

type PublishableEntry =
  | CollectionEntry<"note">
  | CollectionEntry<"problem">;

export function isPublished(entry: PublishableEntry) {
  if (import.meta.env.DEV) {
    return true;
  }

  return !entry.data.draft;
}

export function byPublishedAtDescending(
  a: PublishableEntry,
  b: PublishableEntry,
) {
  return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
}

export async function getPublishedNotes() {
  const notes = await getCollection("note", isPublished);

  return notes.sort(byPublishedAtDescending);
}

export async function getPublishedProblems() {
  const problems = await getCollection("problem", isPublished);

  return problems.sort(byPublishedAtDescending);
}
