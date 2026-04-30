// src/pages/rss.xml.ts
// Combined RSS feed of garden notes + essays. Library/projects/now are
// excluded by design — they're not "post"-shaped reading units.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { slugHref } from '../lib/url';

export async function GET(context: APIContext) {
  const garden = (await getCollection('garden', ({ data }) => !data.draft))
    .map((entry) => ({ entry, base: '/garden/' as const }));
  const essays = (await getCollection('essays', ({ data }) => !data.draft))
    .map((entry) => ({ entry, base: '/essays/' as const }));

  const items = [...garden, ...essays]
    .map(({ entry, base }) => ({
      title: entry.data.title,
      description: entry.data.description ?? '',
      pubDate: entry.data.updated ?? entry.data.created,
      link: `${base}${slugHref(entry.id)}/`,
      categories: entry.data.tags,
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: "Tommy's Digital Garden",
    description:
      'Notes, essays, and projects on philosophy, AI, robotics, EEG, psychology, sci-fi.',
    site: context.site!,
    items,
    // Mixed zh/en content; we tag the feed as zh-CN since that's the
    // primary locale. Per-item language is conveyed by the linked page.
    customData: '<language>zh-CN</language>',
  });
}
