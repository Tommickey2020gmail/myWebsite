# tommickey.cn

Personal digital garden — Astro 6 + Tailwind 4 + Obsidian-as-CMS.

## Local development

Requires Node ≥ 22.12 and pnpm 10. (`nvm use 22.17.1` if you have nvm.)

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # ./dist
pnpm preview      # serve dist locally
```

## Project layout

```
src/
  content/         ← markdown notes (the Obsidian vault)
    garden/
    essays/
    projects/
    library/   (books + papers)
    now/
  pages/           ← Astro routes
  components/      ← header / footer / theme + lang toggle / PostMeta
  layouts/BaseLayout.astro
  lib/
    i18n.ts        ← locale path helpers (hreflang, language switch)
    url.ts         ← slugHref + paperHref helpers
  styles/global.css
public/            ← robots.txt, llms.txt, static assets
```

## Writing content

Notes are markdown files under `src/content/`. See [`docs/obsidian-setup.md`](./docs/obsidian-setup.md)
for the recommended Obsidian-on-Windows workflow.

The frontmatter schema for each collection lives in [`src/content.config.ts`](./src/content.config.ts).

## Deployment

Push to `main` → Cloudflare Pages auto-builds and deploys to https://tommickey.cn.
Build settings live in the Cloudflare dashboard, not in this repo.
