// src/lib/backlinks.ts
// Build a reverse index: for each garden/essay entry, which other entries
// link TO it via wikilinks? Computed once per build.
import { getCollection } from 'astro:content';
import { resolveWikilink } from './registry';
import { slugHref } from './url';

export interface Backlink {
  collection: 'garden' | 'essays';
  id: string;
  title: string;
  href: string;
}

const WIKILINK = /\[\[([^\[\]\n|]+?)(?:\|[^\[\]\n]+)?\]\]/g;

let cache: Map<string, Backlink[]> | null = null;

async function build(): Promise<Map<string, Backlink[]>> {
  const map = new Map<string, Backlink[]>();
  const collections: Array<'garden' | 'essays'> = ['garden', 'essays'];
  for (const collection of collections) {
    const entries = await getCollection(collection, ({ data }) => !data.draft);
    for (const entry of entries) {
      const body = entry.body ?? '';
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      WIKILINK.lastIndex = 0;
      while ((m = WIKILINK.exec(body)) !== null) {
        const target = resolveWikilink(m[1]);
        if (!target) continue;
        const key = `${target.collection}:${target.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const list = map.get(key) ?? [];
        list.push({
          collection,
          id: entry.id,
          title: entry.data.title,
          href: `/${collection}/${slugHref(entry.id)}/`,
        });
        map.set(key, list);
      }
    }
  }
  return map;
}

export async function getBacklinks(
  collection: 'garden' | 'essays',
  id: string,
): Promise<Backlink[]> {
  if (!cache) cache = await build();
  return cache.get(`${collection}:${id}`) ?? [];
}
