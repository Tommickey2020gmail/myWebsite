// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkWikilinks from './src/lib/wikilinks.ts';
import rehypeLangSplit from './src/lib/lang-split.ts';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Build URL → lastmod map by scanning content collection frontmatter.
// Used by sitemap serialize so detail pages emit accurate <lastmod>.
function buildLastmodMap() {
  const map = new Map();
  const collections = [
    { dir: 'src/content/garden', route: '/garden/' },
    { dir: 'src/content/essays', route: '/essays/' },
    { dir: 'src/content/projects', route: '/projects/' },
    { dir: 'src/content/now', route: '/now/' },
  ];
  const dateRe = /^(created|updated):\s*(\S+)/m;
  for (const { dir, route } of collections) {
    let files;
    try { files = readdirSync(dir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const slug = f.replace(/\.md$/, '');
      const url = `https://tommickey.cn${route}${slug}/`;
      const path = join(dir, f);
      let raw;
      try { raw = readFileSync(path, 'utf8'); } catch { continue; }
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      const body = fm[1];
      const created = body.match(/^created:\s*(\S+)/m)?.[1];
      const updated = body.match(/^updated:\s*(\S+)/m)?.[1];
      const stamp = updated || created;
      if (stamp) map.set(url, new Date(stamp).toISOString());
    }
  }
  return map;
}
const LASTMOD = buildLastmodMap();

export default defineConfig({
  site: 'https://tommickey.cn',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/search/') && !page.includes('/random/'),
      serialize(item) {
        const u = item.url;
        const path = u.replace(/^https?:\/\/[^/]+/, '');
        if (path === '/' || path === '') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (
          path === '/essays/' ||
          path === '/garden/' ||
          path === '/projects/' ||
          path === '/library/' ||
          path === '/about/' ||
          path === '/now/'
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/tags/')) {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        const lastmod = LASTMOD.get(u);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkWikilinks],
    rehypePlugins: [rehypeLangSplit],
  },
  build: { format: 'directory' },
});
