// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkWikilinks from './src/lib/wikilinks.ts';
import rehypeLangSplit from './src/lib/lang-split.ts';

export default defineConfig({
  site: 'https://tommickey.cn',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkWikilinks],
    rehypePlugins: [rehypeLangSplit],
  },
  build: { format: 'directory' },
});
