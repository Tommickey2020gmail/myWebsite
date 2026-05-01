// src/pages/search-index.json.ts
// Static JSON index consumed by /search/ for client-side fuzzy matching.
// Includes everything indexable: garden + essays + projects, plus their
// tags. Body is included up to a small budget so substring matches surface
// content hits, not just titles.
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { slugHref } from '../lib/url';

const BODY_BUDGET = 600; // characters of body included per entry

interface IndexEntry {
  kind: 'garden' | 'essays' | 'projects';
  href: string;
  title: string;
  description?: string;
  tags: string[];
  body: string;
  date: string;
}

export async function GET(_ctx: APIContext) {
  const kinds: Array<IndexEntry['kind']> = ['garden', 'essays', 'projects'];
  const out: IndexEntry[] = [];
  for (const kind of kinds) {
    const entries = await getCollection(kind, ({ data }) => !data.draft);
    for (const e of entries) {
      // Strip code fences + frontmatter-like markers so search hits prose.
      const body = (e.body ?? '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, BODY_BUDGET);
      out.push({
        kind,
        href: `/${kind}/${slugHref(e.id)}/`,
        title: e.data.title,
        description: e.data.description,
        tags: e.data.tags ?? [],
        body,
        date: ((e.data.updated ?? e.data.created) as Date).toISOString().slice(0, 10),
      });
    }
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
