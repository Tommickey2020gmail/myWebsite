# Personal Website — Phase 1 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a deployable personal website at `tommickey.cn` with all six content sections (garden / essays / projects / library / now / about), light/dark theme, zh/en i18n, basic SEO, and an Obsidian-based writing workflow.

**Architecture:** Astro 5 static site, Tailwind CSS 4, Content Collections for typed markdown content. The website repo doubles as an Obsidian vault — the user writes notes in `src/content/` on Windows via Obsidian + Obsidian Git plugin, pushes to GitHub, Cloudflare Pages auto-deploys. No runtime sync script needed in Phase 1; the file path in Obsidian IS the URL slug in Astro.

**Tech Stack:**
- Astro 5.x (static)
- Tailwind CSS 4 (Vite plugin)
- TypeScript
- pnpm
- Content Collections (Zod-typed)
- @astrojs/sitemap, @astrojs/rss
- Cloudflare Pages (hosting)
- GitHub (source)

**Reference design:** See `docs/plans/2026-04-30-personal-website-design.md` for visual & content-strategy details.

---

## Pre-flight: Confirm prerequisites

Before Task 1, verify on the Linux dev machine:

```bash
node --version    # expect v20+ (Astro 5 requires Node 18.20+ / 20.3+ / 22+)
pnpm --version    # expect v9+
git --version     # any recent
```

If pnpm is missing: `npm install -g pnpm`. If Node is too old: install via nvm.

User actions (outside this plan):
- [ ] Create empty GitHub repo `tommickey/myWebsite` (or whatever username) — DO NOT initialize with README/LICENSE
- [ ] Have GitHub credentials / SSH key ready on the Linux machine

---

## Task 1: Initialize git repo and Astro project

**Files:**
- Create: `/home/tommy/code/myWebsite/.gitignore`
- Create: `/home/tommy/code/myWebsite/package.json` (via Astro CLI)
- Create: `/home/tommy/code/myWebsite/astro.config.mjs` (via Astro CLI)
- Create: `/home/tommy/code/myWebsite/src/pages/index.astro` (via Astro CLI)

**Step 1: Initialize git in the project directory**

```bash
cd /home/tommy/code/myWebsite
git init -b main
```

Expected: `Initialized empty Git repository`.

**Step 2: Run Astro CLI to scaffold a minimal project in current directory**

```bash
cd /home/tommy/code/myWebsite
pnpm create astro@latest . --template minimal --typescript strict --install --no-git
```

When prompted "Directory not empty, continue?": yes.
Expected: Astro creates `package.json`, `astro.config.mjs`, `src/`, `public/`, `tsconfig.json`, `.gitignore`. Dependencies install.

**Step 3: Verify dev server runs**

```bash
pnpm dev --host 0.0.0.0
```

Expected: Output `Local: http://localhost:4321/`. Stop with Ctrl+C.

**Step 4: Add Obsidian-related entries to .gitignore**

Append to `/home/tommy/code/myWebsite/.gitignore`:

```
# Obsidian (vault state, not content)
.obsidian/
.trash/
.obsidian.vimrc

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Logs
*.log
```

**Step 5: Initial commit**

```bash
cd /home/tommy/code/myWebsite
git add -A
git commit -m "chore: scaffold Astro project"
```

**Step 6: Connect GitHub remote and push**

User must provide the GitHub repo URL. Replace `<URL>` below:

```bash
git remote add origin <URL>
git push -u origin main
```

Expected: branch published.

---

## Task 2: Install Tailwind CSS 4 and core integrations

**Files:**
- Modify: `/home/tommy/code/myWebsite/package.json`
- Modify: `/home/tommy/code/myWebsite/astro.config.mjs`
- Create: `/home/tommy/code/myWebsite/src/styles/global.css`

**Step 1: Install dependencies**

```bash
cd /home/tommy/code/myWebsite
pnpm add -D tailwindcss @tailwindcss/vite @tailwindcss/typography
pnpm add @astrojs/sitemap @astrojs/rss
```

**Step 2: Replace `astro.config.mjs` with full config**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://tommickey.cn',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-CN', en: 'en-US' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
```

**Step 3: Create `src/styles/global.css`**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* Light theme tokens */
  --color-bg: #FAF8F3;
  --color-fg: #1F1A17;
  --color-accent: #B85C38;
  --color-secondary: #5C8A6B;
  --color-muted: #6B6157;
  --color-border: #E5DFD3;

  /* Fonts */
  --font-serif-zh: "Noto Serif SC", "Source Han Serif SC", serif;
  --font-serif-en: "Cardo", "EB Garamond", Georgia, serif;
  --font-display-zh: "LXGW WenKai", "霞鹜文楷", serif;
  --font-display-en: "Fraunces", Georgia, serif;
  --font-mono: "JetBrains Mono", "Source Code Pro", monospace;
}

@layer base {
  :root {
    color-scheme: light;
  }

  :root.dark {
    color-scheme: dark;
    --color-bg: #0E1116;
    --color-fg: #E5E1D8;
    --color-accent: #7DD3FC;
    --color-secondary: #C084FC;
    --color-muted: #9CA3AF;
    --color-border: #1F2937;
  }

  html {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-serif-zh), var(--font-serif-en);
    font-size: 17px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }

  body {
    min-height: 100dvh;
  }

  h1, h2, h3, h4, h5 {
    font-family: var(--font-display-zh), var(--font-display-en);
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  a {
    color: var(--color-accent);
    text-underline-offset: 3px;
  }

  a:hover {
    text-decoration: underline;
  }

  ::selection {
    background-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  }
}
```

**Step 4: Verify dev server still runs and shows the page**

```bash
pnpm dev --host 0.0.0.0
```

Open in browser; the default Astro page should render with the Tailwind/CSS tokens loaded (background should be `#FAF8F3`).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS 4 and core integrations"
```

---

## Task 3: Define Content Collections schemas

**Files:**
- Create: `/home/tommy/code/myWebsite/src/content.config.ts`
- Create: `/home/tommy/code/myWebsite/src/content/garden/.gitkeep`
- Create: `/home/tommy/code/myWebsite/src/content/essays/.gitkeep`
- Create: `/home/tommy/code/myWebsite/src/content/projects/.gitkeep`
- Create: `/home/tommy/code/myWebsite/src/content/books/.gitkeep`
- Create: `/home/tommy/code/myWebsite/src/content/papers/.gitkeep`
- Create: `/home/tommy/code/myWebsite/src/content/now/.gitkeep`

**Step 1: Create directories**

```bash
cd /home/tommy/code/myWebsite
mkdir -p src/content/{garden,essays,projects,books,papers,now}
touch src/content/{garden,essays,projects,books,papers,now}/.gitkeep
```

**Step 2: Create `src/content.config.ts`**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseFields = {
  title: z.string(),
  description: z.string().optional(),
  lang: z.enum(['zh', 'en']).default('zh'),
  tags: z.array(z.string()).default([]),
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
};

const garden = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/garden' }),
  schema: z.object({
    ...baseFields,
    status: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),
  }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    ...baseFields,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    ...baseFields,
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    ...baseFields,
    author: z.string(),
    rating: z.number().min(1).max(5).optional(),
    finished: z.coerce.date().optional(),
  }),
});

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    ...baseFields,
    authors: z.array(z.string()).default([]),
    venue: z.string().optional(),
    link: z.string().url(),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/now' }),
  schema: z.object({
    ...baseFields,
  }),
});

export const collections = { garden, essays, projects, books, papers, now };
```

**Step 3: Verify type generation**

```bash
pnpm astro sync
```

Expected: `astro/content.d.ts` regenerated, no errors. If errors: check Zod schema syntax.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: define content collections for all sections"
```

---

## Task 4: Build the base layout with theme toggle

**Files:**
- Create: `/home/tommy/code/myWebsite/src/layouts/BaseLayout.astro`
- Create: `/home/tommy/code/myWebsite/src/components/Header.astro`
- Create: `/home/tommy/code/myWebsite/src/components/Footer.astro`
- Create: `/home/tommy/code/myWebsite/src/components/ThemeToggle.astro`
- Create: `/home/tommy/code/myWebsite/src/components/LangSwitch.astro`

**Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
// src/layouts/BaseLayout.astro
import "../styles/global.css";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";

export interface Props {
  title: string;
  description?: string;
  lang?: 'zh' | 'en';
  ogImage?: string;
  canonical?: string;
}

const {
  title,
  description = "Tommy's digital garden — philosophy, AI, robotics, EEG biofeedback, psychology, science fiction.",
  lang = 'zh',
  ogImage = '/og-default.png',
  canonical,
} = Astro.props;

const siteUrl = Astro.site?.toString().replace(/\/$/, '') ?? 'https://tommickey.cn';
const canonicalUrl = canonical ?? new URL(Astro.url.pathname, siteUrl).toString();
const fullTitle = title === 'Home' ? 'Tommy — Digital Garden' : `${title} · Tommy`;
---
<!DOCTYPE html>
<html lang={lang === 'en' ? 'en-US' : 'zh-CN'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={new URL(ogImage, siteUrl).toString()} />
    <meta property="og:locale" content={lang === 'en' ? 'en_US' : 'zh_CN'} />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />

    {/* hreflang */}
    <link rel="alternate" hreflang="zh-CN" href={`${siteUrl}${Astro.url.pathname}`} />
    <link rel="alternate" hreflang="en-US" href={`${siteUrl}${Astro.url.pathname}`} />
    <link rel="alternate" hreflang="x-default" href={`${siteUrl}${Astro.url.pathname}`} />

    {/* Theme: prevent FOUC */}
    <script is:inline>
      (function () {
        const stored = localStorage.getItem('theme');
        const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored ?? (prefers ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
      })();
    </script>

    {/* RSS auto-discovery */}
    <link rel="alternate" type="application/rss+xml" title="Tommy's Garden" href="/rss.xml" />
  </head>
  <body class="min-h-dvh flex flex-col">
    <Header />
    <main class="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-6 py-10">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Step 2: Create `src/components/ThemeToggle.astro`**

```astro
---
// src/components/ThemeToggle.astro
---
<button
  id="theme-toggle"
  type="button"
  aria-label="Toggle theme"
  class="rounded-md p-2 text-sm hover:bg-[color:var(--color-border)] transition-colors"
>
  <span class="hidden dark:inline">☀</span>
  <span class="inline dark:hidden">☾</span>
</button>

<script is:inline>
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
</script>
```

**Step 3: Create `src/components/LangSwitch.astro`**

```astro
---
// src/components/LangSwitch.astro
const path = Astro.url.pathname;
const isEnglish = path.startsWith('/en');
const targetPath = isEnglish ? path.replace(/^\/en/, '') || '/' : `/en${path === '/' ? '' : path}`;
---
<a
  href={targetPath}
  class="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
  aria-label={isEnglish ? '中文' : 'English'}
>
  {isEnglish ? '中' : 'EN'}
</a>
```

**Step 4: Create `src/components/Header.astro`**

```astro
---
// src/components/Header.astro
import ThemeToggle from "./ThemeToggle.astro";
import LangSwitch from "./LangSwitch.astro";

const links = [
  { href: '/', label: 'Home' },
  { href: '/garden', label: 'Garden' },
  { href: '/essays', label: 'Essays' },
  { href: '/projects', label: 'Projects' },
  { href: '/library', label: 'Library' },
  { href: '/now', label: 'Now' },
  { href: '/about', label: 'About' },
];

const current = Astro.url.pathname;
---
<header class="border-b border-[color:var(--color-border)]">
  <div class="mx-auto max-w-3xl px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
    <a href="/" class="font-serif text-lg tracking-tight no-underline hover:opacity-80">
      Tommy
    </a>
    <nav class="flex items-center gap-4 overflow-x-auto">
      {links.map(({ href, label }) => (
        <a
          href={href}
          class:list={[
            'text-sm whitespace-nowrap no-underline hover:text-[color:var(--color-accent)]',
            current === href || (href !== '/' && current.startsWith(href))
              ? 'text-[color:var(--color-accent)]'
              : 'text-[color:var(--color-fg)]',
          ]}
        >
          {label}
        </a>
      ))}
    </nav>
    <div class="flex items-center gap-2">
      <LangSwitch />
      <ThemeToggle />
    </div>
  </div>
</header>
```

**Step 5: Create `src/components/Footer.astro`**

```astro
---
// src/components/Footer.astro
const year = new Date().getFullYear();
---
<footer class="border-t border-[color:var(--color-border)] mt-16">
  <div class="mx-auto max-w-3xl px-5 sm:px-6 py-8 text-sm text-[color:var(--color-muted)] flex flex-wrap justify-between gap-4">
    <span>© {year} Tommy · Cultivated in the open</span>
    <div class="flex gap-4">
      <a href="/rss.xml" class="hover:text-[color:var(--color-accent)]">RSS</a>
      <a href="/sitemap-index.xml" class="hover:text-[color:var(--color-accent)]">Sitemap</a>
    </div>
  </div>
</footer>
```

**Step 6: Verify dev server**

```bash
pnpm dev --host 0.0.0.0
```

Open `localhost:4321`. The default index page won't yet use BaseLayout (next task) but the layout files should compile without errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: base layout with header, footer, theme + lang toggles"
```

---

## Task 5: Build the homepage

**Files:**
- Replace: `/home/tommy/code/myWebsite/src/pages/index.astro`

**Step 1: Replace `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const allGarden = (await getCollection('garden', ({ data }) => !data.draft))
  .sort((a, b) => (b.data.updated ?? b.data.created).getTime() - (a.data.updated ?? a.data.created).getTime())
  .slice(0, 6);

const featuredProjects = (await getCollection('projects', ({ data }) => !data.draft && data.featured))
  .slice(0, 3);
---
<BaseLayout title="Home" description="Tommy 的数字花园 — 哲学、AI、机器人、脑电反馈、心理学、科幻。">
  <section class="py-10">
    <h1 class="text-4xl sm:text-5xl font-serif leading-tight mb-4">
      Hi, I'm Tommy.
    </h1>
    <p class="text-lg text-[color:var(--color-muted)] max-w-prose">
      I think and build at the intersection of <em>philosophy</em>, <em>AI / robotics</em>,
      <em>EEG biofeedback</em>, <em>psychology</em>, and <em>science fiction</em>.
      This is my digital garden — perpetually growing, never finished.
    </p>
  </section>

  <section class="py-8">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-2xl font-serif">Recent notes</h2>
      <a href="/garden" class="text-sm">All notes →</a>
    </div>
    {allGarden.length === 0 ? (
      <p class="text-[color:var(--color-muted)]">No notes yet — first seedlings coming soon.</p>
    ) : (
      <ul class="space-y-3">
        {allGarden.map((note) => (
          <li>
            <a href={`/garden/${note.id}`} class="block py-1 no-underline hover:text-[color:var(--color-accent)]">
              <span class="font-medium">{note.data.title}</span>
              {note.data.description && (
                <span class="block text-sm text-[color:var(--color-muted)]">{note.data.description}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    )}
  </section>

  {featuredProjects.length > 0 && (
    <section class="py-8">
      <div class="flex items-baseline justify-between mb-4">
        <h2 class="text-2xl font-serif">Selected projects</h2>
        <a href="/projects" class="text-sm">All projects →</a>
      </div>
      <ul class="grid gap-4 sm:grid-cols-2">
        {featuredProjects.map((p) => (
          <li class="border border-[color:var(--color-border)] rounded-lg p-4">
            <a href={`/projects/${p.id}`} class="font-medium no-underline">{p.data.title}</a>
            {p.data.description && (
              <p class="mt-1 text-sm text-[color:var(--color-muted)]">{p.data.description}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )}
</BaseLayout>
```

**Step 2: Verify it renders without crashing (no content yet, so empty state)**

```bash
pnpm dev --host 0.0.0.0
```

Open `localhost:4321`. Expected: hero text + "No notes yet" empty state. No featured projects section.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: homepage with hero, recent notes, featured projects"
```

---

## Task 6: Build collection index pages and dynamic routes

**Files:**
- Create: `/home/tommy/code/myWebsite/src/pages/garden/index.astro`
- Create: `/home/tommy/code/myWebsite/src/pages/garden/[...slug].astro`
- Create: `/home/tommy/code/myWebsite/src/pages/essays/index.astro`
- Create: `/home/tommy/code/myWebsite/src/pages/essays/[...slug].astro`
- Create: `/home/tommy/code/myWebsite/src/pages/projects/index.astro`
- Create: `/home/tommy/code/myWebsite/src/pages/projects/[...slug].astro`
- Create: `/home/tommy/code/myWebsite/src/pages/library/index.astro`
- Create: `/home/tommy/code/myWebsite/src/pages/now/index.astro`
- Create: `/home/tommy/code/myWebsite/src/pages/about.astro`
- Create: `/home/tommy/code/myWebsite/src/components/PostMeta.astro`

**Step 1: Create shared `src/components/PostMeta.astro`**

```astro
---
// src/components/PostMeta.astro
export interface Props {
  created: Date;
  updated?: Date;
  lang?: 'zh' | 'en';
  status?: string;
}
const { created, updated, lang = 'zh', status } = Astro.props;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
---
<div class="flex flex-wrap gap-3 text-xs text-[color:var(--color-muted)]">
  <time datetime={created.toISOString()}>Planted {fmt(created)}</time>
  {updated && updated.getTime() !== created.getTime() && (
    <time datetime={updated.toISOString()}>· Tended {fmt(updated)}</time>
  )}
  {status && (
    <span class="px-1.5 py-0.5 rounded bg-[color:var(--color-border)]">{status}</span>
  )}
  <span>· {lang === 'en' ? 'EN' : '中'}</span>
</div>
```

**Step 2: Create `src/pages/garden/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostMeta from '../../components/PostMeta.astro';

const notes = (await getCollection('garden', ({ data }) => !data.draft))
  .sort((a, b) => (b.data.updated ?? b.data.created).getTime() - (a.data.updated ?? a.data.created).getTime());
---
<BaseLayout title="Garden" description="Tommy 的数字花园：碎片想法、读书笔记、概念地图。">
  <h1 class="text-3xl font-serif mb-2">Digital Garden</h1>
  <p class="text-[color:var(--color-muted)] mb-8">A growing collection of seeds, sprouts, and evergreens.</p>
  {notes.length === 0 ? (
    <p>No notes planted yet.</p>
  ) : (
    <ul class="space-y-6">
      {notes.map((n) => (
        <li>
          <a href={`/garden/${n.id}`} class="block no-underline hover:text-[color:var(--color-accent)]">
            <h2 class="text-xl font-serif">{n.data.title}</h2>
          </a>
          {n.data.description && <p class="text-sm text-[color:var(--color-muted)] mt-1">{n.data.description}</p>}
          <div class="mt-2"><PostMeta created={n.data.created} updated={n.data.updated} lang={n.data.lang} status={n.data.status} /></div>
        </li>
      ))}
    </ul>
  )}
</BaseLayout>
```

**Step 3: Create `src/pages/garden/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostMeta from '../../components/PostMeta.astro';

export async function getStaticPaths() {
  const notes = await getCollection('garden', ({ data }) => !data.draft);
  return notes.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={entry.data.title} description={entry.data.description} lang={entry.data.lang}>
  <article class="prose prose-lg max-w-none">
    <header class="not-prose mb-6">
      <h1 class="text-3xl sm:text-4xl font-serif">{entry.data.title}</h1>
      <div class="mt-3"><PostMeta created={entry.data.created} updated={entry.data.updated} lang={entry.data.lang} status={entry.data.status} /></div>
      {entry.data.tags.length > 0 && (
        <div class="mt-3 flex flex-wrap gap-2">
          {entry.data.tags.map((t) => (
            <span class="text-xs px-2 py-0.5 rounded bg-[color:var(--color-border)]">#{t}</span>
          ))}
        </div>
      )}
    </header>
    <Content />
  </article>
</BaseLayout>
```

**Step 4: Create `src/pages/essays/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostMeta from '../../components/PostMeta.astro';

const all = (await getCollection('essays', ({ data }) => !data.draft))
  .sort((a, b) => b.data.created.getTime() - a.data.created.getTime());
const zh = all.filter((e) => e.data.lang === 'zh');
const en = all.filter((e) => e.data.lang === 'en');
---
<BaseLayout title="Essays" description="Long-form writing on philosophy, AI, robotics, EEG, psychology.">
  <h1 class="text-3xl font-serif mb-2">Essays</h1>
  <p class="text-[color:var(--color-muted)] mb-8">Longer thoughts, when seedlings grow into trees.</p>

  {zh.length > 0 && (
    <section class="mb-10">
      <h2 class="text-xl font-serif mb-4">中文</h2>
      <ul class="space-y-4">
        {zh.map((e) => (
          <li>
            <a href={`/essays/${e.id}`} class="font-medium no-underline">{e.data.title}</a>
            {e.data.description && <p class="text-sm text-[color:var(--color-muted)]">{e.data.description}</p>}
            <div class="mt-1"><PostMeta created={e.data.created} updated={e.data.updated} lang={e.data.lang} /></div>
          </li>
        ))}
      </ul>
    </section>
  )}

  {en.length > 0 && (
    <section>
      <h2 class="text-xl font-serif mb-4">English</h2>
      <ul class="space-y-4">
        {en.map((e) => (
          <li>
            <a href={`/essays/${e.id}`} class="font-medium no-underline">{e.data.title}</a>
            {e.data.description && <p class="text-sm text-[color:var(--color-muted)]">{e.data.description}</p>}
            <div class="mt-1"><PostMeta created={e.data.created} updated={e.data.updated} lang={e.data.lang} /></div>
          </li>
        ))}
      </ul>
    </section>
  )}

  {all.length === 0 && <p>No essays yet.</p>}
</BaseLayout>
```

**Step 5: Create `src/pages/essays/[...slug].astro`** (mirror garden detail page)

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostMeta from '../../components/PostMeta.astro';

export async function getStaticPaths() {
  const all = await getCollection('essays', ({ data }) => !data.draft);
  return all.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={entry.data.title} description={entry.data.description} lang={entry.data.lang}>
  <article class="prose prose-lg max-w-none">
    <header class="not-prose mb-6">
      <h1 class="text-3xl sm:text-4xl font-serif">{entry.data.title}</h1>
      <div class="mt-3"><PostMeta created={entry.data.created} updated={entry.data.updated} lang={entry.data.lang} /></div>
    </header>
    <Content />
  </article>
</BaseLayout>
```

**Step 6: Create `src/pages/projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const projects = (await getCollection('projects', ({ data }) => !data.draft))
  .sort((a, b) => b.data.created.getTime() - a.data.created.getTime());
---
<BaseLayout title="Projects" description="Things I've built — robotics, EEG biofeedback, AI tools, software & hardware.">
  <h1 class="text-3xl font-serif mb-2">Projects</h1>
  <p class="text-[color:var(--color-muted)] mb-8">Things I've actually built.</p>
  {projects.length === 0 ? (
    <p>No projects published yet.</p>
  ) : (
    <ul class="grid gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <li class="border border-[color:var(--color-border)] rounded-lg p-5">
          <a href={`/projects/${p.id}`} class="block no-underline">
            <h2 class="font-serif text-xl">{p.data.title}</h2>
          </a>
          {p.data.description && <p class="mt-2 text-sm text-[color:var(--color-muted)]">{p.data.description}</p>}
          {p.data.stack.length > 0 && (
            <div class="mt-3 flex flex-wrap gap-1.5">
              {p.data.stack.map((s) => (
                <span class="text-xs px-2 py-0.5 rounded bg-[color:var(--color-border)]">{s}</span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )}
</BaseLayout>
```

**Step 7: Create `src/pages/projects/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostMeta from '../../components/PostMeta.astro';

export async function getStaticPaths() {
  const all = await getCollection('projects', ({ data }) => !data.draft);
  return all.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={entry.data.title} description={entry.data.description} lang={entry.data.lang}>
  <article class="prose prose-lg max-w-none">
    <header class="not-prose mb-6">
      <h1 class="text-3xl sm:text-4xl font-serif">{entry.data.title}</h1>
      <div class="mt-3"><PostMeta created={entry.data.created} updated={entry.data.updated} lang={entry.data.lang} /></div>
      <div class="mt-3 flex gap-3 text-sm">
        {entry.data.repo && <a href={entry.data.repo}>Source ↗</a>}
        {entry.data.demo && <a href={entry.data.demo}>Demo ↗</a>}
      </div>
    </header>
    <Content />
  </article>
</BaseLayout>
```

**Step 8: Create `src/pages/library/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const books = (await getCollection('books', ({ data }) => !data.draft))
  .sort((a, b) => (b.data.finished ?? b.data.created).getTime() - (a.data.finished ?? a.data.created).getTime());
const papers = (await getCollection('papers', ({ data }) => !data.draft))
  .sort((a, b) => b.data.created.getTime() - a.data.created.getTime());
---
<BaseLayout title="Library" description="Books and papers I've read and recommend.">
  <h1 class="text-3xl font-serif mb-2">Library</h1>
  <p class="text-[color:var(--color-muted)] mb-8">Inputs that shaped my thinking.</p>

  <section class="mb-12">
    <h2 class="text-xl font-serif mb-4">Books</h2>
    {books.length === 0 ? (
      <p class="text-[color:var(--color-muted)]">No books logged yet.</p>
    ) : (
      <ul class="space-y-3">
        {books.map((b) => (
          <li class="flex flex-wrap items-baseline justify-between gap-2">
            <span><strong>{b.data.title}</strong> <span class="text-[color:var(--color-muted)]">— {b.data.author}</span></span>
            {b.data.rating && <span class="text-sm text-[color:var(--color-muted)]">{'★'.repeat(b.data.rating)}</span>}
          </li>
        ))}
      </ul>
    )}
  </section>

  <section>
    <h2 class="text-xl font-serif mb-4">Papers & links</h2>
    {papers.length === 0 ? (
      <p class="text-[color:var(--color-muted)]">No papers logged yet.</p>
    ) : (
      <ul class="space-y-3">
        {papers.map((p) => (
          <li>
            <a href={p.data.link} class="font-medium">{p.data.title} ↗</a>
            {p.data.venue && <span class="text-sm text-[color:var(--color-muted)]"> · {p.data.venue}</span>}
          </li>
        ))}
      </ul>
    )}
  </section>
</BaseLayout>
```

**Step 9: Create `src/pages/now/index.astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const all = (await getCollection('now', ({ data }) => !data.draft))
  .sort((a, b) => (b.data.updated ?? b.data.created).getTime() - (a.data.updated ?? a.data.created).getTime());
const latest = all[0];
const Content = latest ? (await render(latest)).Content : null;
---
<BaseLayout title="Now" description="What I'm focused on right now.">
  <h1 class="text-3xl font-serif mb-2">Now</h1>
  <p class="text-[color:var(--color-muted)] mb-8">
    Inspired by <a href="https://nownownow.com/about">nownownow.com</a> — a snapshot of where my attention is.
  </p>
  {latest ? (
    <article class="prose prose-lg max-w-none">
      <p class="text-sm text-[color:var(--color-muted)]">
        Updated {(latest.data.updated ?? latest.data.created).toISOString().slice(0, 10)}
      </p>
      {Content && <Content />}
    </article>
  ) : (
    <p>No "now" entry yet.</p>
  )}
</BaseLayout>
```

**Step 10: Create `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About" description="About Tommy — interests, work, and how to reach me.">
  <article class="prose prose-lg max-w-none">
    <h1>About</h1>
    <p>
      I'm Tommy. I think and build at the intersection of philosophy, AI, robotics, EEG biofeedback,
      psychology, dementia prevention, and science fiction. This site is my open notebook.
    </p>
    <h2>What I'm into</h2>
    <ul>
      <li><strong>Philosophy</strong> — mind, consciousness, ethics of technology</li>
      <li><strong>Software & hardware</strong> — full-stack, embedded, robotics</li>
      <li><strong>AI</strong> — applied LLMs, agents, alignment</li>
      <li><strong>EEG biofeedback</strong> — attention training, cognitive enhancement</li>
      <li><strong>Psychology</strong> — cognitive science, behavior change</li>
      <li><strong>Dementia prevention</strong> — lifestyle, neuroprotection research</li>
      <li><strong>Science fiction</strong> — Liu Cixin, Greg Egan, Ted Chiang</li>
    </ul>
    <h2>Contact</h2>
    <ul>
      <li>Email: <a href="mailto:hello@tommickey.cn">hello@tommickey.cn</a></li>
      <li>GitHub: <a href="https://github.com/tommickey">@tommickey</a></li>
    </ul>
    <hr />
    <h2 lang="zh">关于我</h2>
    <p lang="zh">
      我是 Tommy。我的兴趣在哲学、计算机软硬件、机器人、AI、脑电生物反馈专注力训练、心理学、
      老年痴呆预防、科幻小说交汇之处。这个网站是我公开的思考笔记。
    </p>
  </article>
</BaseLayout>
```

**Step 11: Build and verify all routes resolve**

```bash
pnpm build
```

Expected: build succeeds with 0 errors. Pages listed: `/`, `/garden`, `/essays`, `/projects`, `/library`, `/now`, `/about`.

**Step 12: Commit**

```bash
git add -A
git commit -m "feat: add all section index pages and dynamic content routes"
```

---

## Task 7: SEO essentials — robots, sitemap, RSS

**Files:**
- Create: `/home/tommy/code/myWebsite/public/robots.txt`
- Create: `/home/tommy/code/myWebsite/src/pages/rss.xml.ts`
- Create: `/home/tommy/code/myWebsite/public/llms.txt`

**Step 1: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://tommickey.cn/sitemap-index.xml
```

**Step 2: Create `src/pages/rss.xml.ts`**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const garden = await getCollection('garden', ({ data }) => !data.draft);
  const essays = await getCollection('essays', ({ data }) => !data.draft);

  const items = [...garden, ...essays]
    .map((e) => ({
      title: e.data.title,
      description: e.data.description ?? '',
      pubDate: e.data.updated ?? e.data.created,
      link:
        ('status' in e.data ? '/garden/' : '/essays/') + e.id,
      categories: e.data.tags,
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: "Tommy's Digital Garden",
    description: 'Notes, essays, and projects on philosophy, AI, robotics, EEG, psychology, sci-fi.',
    site: context.site!,
    items,
    customData: '<language>zh-CN</language>',
  });
}
```

**Step 3: Create `public/llms.txt`** (AI-crawler friendly summary)

```
# Tommy — Personal Digital Garden

> A growing collection of notes, essays, and projects at the intersection of
> philosophy, AI, robotics, EEG biofeedback, psychology, dementia prevention,
> and science fiction. Bilingual (zh / en).

## Sections
- /garden  : Digital garden — interlinked notes, evergreens
- /essays  : Long-form essays (zh + en)
- /projects: Software, hardware, robotics, AI projects
- /library : Books and papers I recommend
- /now     : What I'm focused on right now
- /about   : About me + contact

## Sitemap
- /sitemap-index.xml
```

**Step 4: Build and verify outputs exist**

```bash
pnpm build
```

After build, check `dist/` contains:
- `robots.txt`
- `rss.xml`
- `sitemap-index.xml`
- `llms.txt`

```bash
ls -la /home/tommy/code/myWebsite/dist/ | grep -E '(robots|rss|sitemap|llms)'
```

Expected: 4 lines listed.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: SEO basics — robots.txt, rss feed, llms.txt"
```

---

## Task 8: Seed content — write 6 starter posts

**Files:** (one per directory to validate the schema)
- Create: `/home/tommy/code/myWebsite/src/content/garden/welcome-to-the-garden.md`
- Create: `/home/tommy/code/myWebsite/src/content/garden/eeg-and-philosophy.md`
- Create: `/home/tommy/code/myWebsite/src/content/essays/zh-shenmeshi-shuziyuan.md`
- Create: `/home/tommy/code/myWebsite/src/content/projects/personal-website.md`
- Create: `/home/tommy/code/myWebsite/src/content/now/2026-04.md`
- Create: `/home/tommy/code/myWebsite/src/content/books/godel-escher-bach.md`

**Step 1: `src/content/garden/welcome-to-the-garden.md`**

```markdown
---
title: Welcome to the garden
description: 这里是我的数字花园 — 一个永远在生长、永远未完成的笔记空间。
lang: zh
status: seedling
created: 2026-04-30
tags: [meta, digital-garden]
---

这是一个**数字花园**，不是博客。

博客像广播，按时间倒序播放成品。花园像森林，让想法在原地生长、互相纠缠、慢慢成熟。

## 三种成熟度

- 🌱 **Seedling** — 刚冒出的想法，可能有错，可能很碎
- 🌿 **Budding** — 已经长出几片叶子，框架成形
- 🌲 **Evergreen** — 反复打磨，可作长期参考

每一篇笔记都会标注它当前的状态。
```

**Step 2: `src/content/garden/eeg-and-philosophy.md`**

```markdown
---
title: EEG and the philosophy of attention
description: 当我们用脑电信号反馈训练专注力时，我们在训练什么？
lang: en
status: seedling
created: 2026-04-30
tags: [eeg, philosophy, attention]
---

When we train attention via EEG biofeedback, what is the *object* of training?

A naive reading says: we train the brain to produce more "focused" alpha/beta ratios.
But attention isn't a brain state — it's a relation between agent and world.

This is a seed I want to grow.
```

**Step 3: `src/content/essays/zh-shenmeshi-shuziyuan.md`**

```markdown
---
title: 什么是数字花园
description: 一种比博客更慢、更耐心、更允许犯错的写作方式。
lang: zh
created: 2026-04-30
tags: [meta, writing]
---

博客是表演，数字花园是耕作。

(此处长文待补)
```

**Step 4: `src/content/projects/personal-website.md`**

```markdown
---
title: tommickey.cn (this site)
description: Astro 5 + Tailwind 4 + Obsidian-as-CMS digital garden.
lang: en
created: 2026-04-30
featured: true
stack: [Astro, Tailwind, TypeScript, Cloudflare Pages, Obsidian]
repo: https://github.com/tommickey/myWebsite
tags: [meta, web]
---

The site you're reading. Source available, content open.
```

**Step 5: `src/content/now/2026-04.md`**

```markdown
---
title: April 2026
lang: en
created: 2026-04-30
updated: 2026-04-30
---

- Building this digital garden
- Reading: *Gödel, Escher, Bach*
- Tinkering with EEG attention training prototypes
- Exploring agentic LLM patterns
```

**Step 6: `src/content/books/godel-escher-bach.md`**

```markdown
---
title: Gödel, Escher, Bach
author: Douglas Hofstadter
lang: en
rating: 5
created: 2026-04-30
finished: 2026-04-30
tags: [philosophy, cognitive-science, recursion]
---

The book that taught me strange loops are the substrate of mind.
```

**Step 7: Build with seed content**

```bash
pnpm build
```

Expected: 6 content pages plus 7 index/static pages built. No errors.

**Step 8: Run dev server and click through every section**

```bash
pnpm dev --host 0.0.0.0
```

Visit each: `/`, `/garden`, `/garden/welcome-to-the-garden`, `/essays`, `/essays/zh-shenmeshi-shuziyuan`, `/projects`, `/projects/personal-website`, `/library`, `/now`, `/about`. All should render correctly with content.

**Step 9: Commit**

```bash
git add -A
git commit -m "content: 6 seed posts across all sections"
```

---

## Task 9: Mobile responsiveness pass

**Files:**
- Modify: existing components as needed.

**Step 1: Run dev server, open in browser dev tools mobile mode (iPhone 14 / 390×844)**

```bash
pnpm dev --host 0.0.0.0
```

**Step 2: Manual checklist**

Walk through each page on mobile width and verify:
- [ ] Header navigation is scrollable horizontally without overflow breaking layout
- [ ] Tap targets ≥ 44×44px (theme/lang buttons)
- [ ] No horizontal scroll on body
- [ ] Font size readable (17px base × 1.0 → 17px on mobile)
- [ ] Code blocks don't break out of viewport
- [ ] Images scale to viewport (none yet, but verify when added)

**Step 3: If any issues, fix them**

Most common fix: add `overflow-x-auto` to nav, ensure `.prose` has `max-w-none` and images get `max-w-full h-auto`.

**Step 4: Verify build still succeeds**

```bash
pnpm build
```

**Step 5: Commit only if changes were needed**

```bash
git add -A
git commit -m "fix: mobile responsiveness for all sections"
```

---

## Task 10: Deploy to Cloudflare Pages

**Files:** none locally (Cloudflare config is via web dashboard)

**Note:** This task requires user action in the Cloudflare dashboard, not code edits.

**Step 1: Push current state to GitHub**

```bash
cd /home/tommy/code/myWebsite
git push
```

**Step 2: User creates Cloudflare Pages project**

Tell user to:
1. Log in to https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
2. Select the GitHub repo `myWebsite`
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Environment variables:**
     - `NODE_VERSION` = `20`
     - `PNPM_VERSION` = `9`
4. Click Save and Deploy. First build takes 1-2 min.

**Step 3: Verify deployment URL works**

After build succeeds, Cloudflare gives a URL like `myWebsite.pages.dev`. Open it; the site should render identically to local.

**Step 4: User binds custom domain `tommickey.cn`**

In Cloudflare Pages project → Custom domains → Set up a custom domain → enter `tommickey.cn` → follow DNS instructions. (Since the domain is already on Cloudflare DNS based on AppCenter setup, this is one-click.)

Also bind `www.tommickey.cn` redirecting to `tommickey.cn`.

**Step 5: Verify HTTPS + custom domain**

Visit `https://tommickey.cn`. Should serve the new site. SSL auto-issued by Cloudflare within ~30 sec.

**Step 6: Verify SEO endpoints publicly**

```bash
curl -I https://tommickey.cn/sitemap-index.xml
curl -I https://tommickey.cn/robots.txt
curl -I https://tommickey.cn/rss.xml
curl -I https://tommickey.cn/llms.txt
```

All four should return `200 OK`.

**Step 7: Submit sitemaps to search engines** (user action)

- Google Search Console: https://search.google.com/search-console → add property `tommickey.cn` → verify (DNS TXT auto via Cloudflare) → submit `https://tommickey.cn/sitemap-index.xml`
- Bing Webmaster Tools: https://www.bing.com/webmasters → import from GSC
- 百度站长平台: https://ziyuan.baidu.com → 普通收录 → 提交 sitemap

**Step 8: No commit needed** — deployment is live.

---

## Task 11: Document the Obsidian-on-Windows setup

**Files:**
- Create: `/home/tommy/code/myWebsite/README.md`
- Create: `/home/tommy/code/myWebsite/docs/obsidian-setup.md`

**Step 1: Create `README.md`**

```markdown
# tommickey.cn

Personal digital garden — Astro 5 + Tailwind 4 + Obsidian-as-CMS.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # ./dist
pnpm preview      # serve dist locally
```

## Writing content

Notes are markdown files under `src/content/`. See [`docs/obsidian-setup.md`](./docs/obsidian-setup.md)
for the recommended Obsidian-on-Windows workflow.

## Deployment

Push to `main` → Cloudflare Pages auto-builds and deploys to https://tommickey.cn.
```

**Step 2: Create `docs/obsidian-setup.md`**

```markdown
# Obsidian-on-Windows Setup

The website repo doubles as an Obsidian vault. No sync script needed.

## One-time setup (Windows)

1. Install Obsidian: https://obsidian.md
2. Install Git for Windows: https://git-scm.com
3. Clone the repo:
   ```
   git clone git@github.com:tommickey/myWebsite.git C:\path\to\myWebsite
   ```
4. Open Obsidian → "Open folder as vault" → select `C:\path\to\myWebsite`
5. Settings → Files & Links → Excluded files: add `node_modules/`, `dist/`, `.astro/`, `public/`, `src/components`, `src/layouts`, `src/pages`, `src/styles` (so the file pane focuses on `src/content/`)
6. Settings → Community plugins → Browse → install **Obsidian Git** by denolehov
7. Configure Obsidian Git:
   - Vault backup interval: 0 (manual)
   - Auto pull interval: 10 min
   - Commit message template: `notes: {{date}}`

## Daily flow

1. Open Obsidian, navigate to `src/content/garden/` (or essays / projects / etc.)
2. New note (Cmd/Ctrl+N) — fill the frontmatter (see schema in `src/content.config.ts`)
3. Write
4. When ready: Ctrl+P → "Obsidian Git: Commit all changes" → "Obsidian Git: Push"
5. Cloudflare Pages auto-builds in ~60 sec; visit https://tommickey.cn

## Frontmatter quick reference

```yaml
---
title: My note title
description: Optional description for SEO + previews.
lang: zh           # or en
tags: [philosophy, eeg]
created: 2026-04-30
status: seedling   # seedling | budding | evergreen (garden only)
draft: false
---
```

## Mobile (optional)

iOS: install **Working Copy** (git client) + **Obsidian Mobile**, link them.
Android: install **Termux** + git, or use the GitHub web editor at github.dev.
```

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: README and Obsidian-on-Windows setup guide"
git push
```

---

## Phase 1 — Done criteria

After Task 11, all of these are true:

- [ ] `https://tommickey.cn` returns the new site (HTTP 200)
- [ ] Light/dark theme toggle works and persists
- [ ] All 7 sections render (`/`, `/garden`, `/essays`, `/projects`, `/library`, `/now`, `/about`)
- [ ] Each collection has at least 1 seed post that displays correctly
- [ ] Mobile (iPhone 14 width) renders without horizontal scroll
- [ ] `sitemap-index.xml`, `rss.xml`, `robots.txt`, `llms.txt` all return 200
- [ ] Lighthouse SEO score ≥ 95 on `/` (run from Chrome DevTools)
- [ ] Pushing a markdown change to `main` deploys live within ~90 sec
- [ ] User can write a new note from Windows Obsidian and publish it without touching the Linux machine

## Out of scope for Phase 1 (deferred to Phase 2+)

- Wiki-link `[[...]]` parser (manual links work fine for seed content)
- Backlinks display
- Pagefind search
- Tag cloud / `/garden/tags`
- Waline comments
- D3 graph (Hero + `/garden/graph`)
- EEG waveform decoration
- Auto OG image generation (satori)
- Umami analytics
- China-region failover

These are addressed in `docs/plans/2026-04-30-personal-website-design.md` Phase 2 onward.
