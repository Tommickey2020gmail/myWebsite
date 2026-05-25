// src/pages/rss.xml.ts
// Combined RSS feed of garden notes + essays. Library/projects/now are
// excluded by design — they're not "post"-shaped reading units.
//
// Emits <content:encoded> with rendered HTML per item so AI aggregators
// (Perplexity, Feedly AI, NewsBlur summaries) can consume full text
// without re-fetching the page.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { slugHref } from '../lib/url';

const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

// Strip wikilink syntax — RSS readers can't resolve `[[Title]]`. Convert
// to plain text of the inner label.
function stripWikilinks(body: string): string {
  return body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) =>
    String(alias ?? target).trim(),
  );
}

function renderBody(body: string, siteUrl: string): string {
  const rendered = md.render(stripWikilinks(body));
  // Resolve relative image/asset URLs against the canonical site so RSS
  // readers can fetch them.
  const absolutised = rendered.replace(
    /(src|href)="\/([^"]*)"/g,
    `$1="${siteUrl.replace(/\/$/, '')}/$2"`,
  );
  return sanitizeHtml(absolutised, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      a: ['href', 'name', 'target', 'rel'],
      '*': ['lang', 'id', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

export async function GET(context: APIContext) {
  const siteUrl = context.site!.toString();
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
      content: renderBody(entry.body ?? '', siteUrl),
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
