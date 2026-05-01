// src/lib/tags.ts
// Collect tagged entries across every collection that uses the `tags` field.
// Exposes a flat list (for /tags/[tag]/ pages) and a count map (for /tags/).
import { getCollection } from 'astro:content';
import { slugHref } from './url';

// Only collections with detail pages are included — books/papers/now currently
// render only as index lists, so linking individual entries would 404.
export type TaggedKind = 'garden' | 'essays' | 'projects';

export interface TaggedEntry {
  kind: TaggedKind;
  id: string;
  href: string;
  title: string;
  description?: string;
  date: Date;
  tags: string[];
}

const baseFor = (kind: TaggedKind): string =>
  ({
    garden: '/garden/',
    essays: '/essays/',
    projects: '/projects/',
  }[kind]);

export async function getAllTaggedEntries(): Promise<TaggedEntry[]> {
  const kinds: TaggedKind[] = ['garden', 'essays', 'projects'];
  const lists = await Promise.all(
    kinds.map(async (kind) => {
      const entries = await getCollection(kind, ({ data }) => !data.draft);
      return entries.map<TaggedEntry>((entry) => ({
        kind,
        id: entry.id,
        href: `${baseFor(kind)}${slugHref(entry.id)}/`,
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.updated ?? entry.data.created,
        tags: entry.data.tags ?? [],
      }));
    }),
  );
  return lists.flat();
}

/** Slug-encode a tag for use in URLs. Tags can be CJK or contain spaces. */
export function tagHref(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}/`;
}
