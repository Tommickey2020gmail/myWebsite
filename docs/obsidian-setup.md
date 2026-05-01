# Obsidian-on-Windows Setup

The website repo doubles as an Obsidian vault. No sync script needed —
Obsidian writes to `src/content/`, Git pushes, Cloudflare Pages builds.

## One-time setup (Windows)

1. Install Obsidian: https://obsidian.md
2. Install Git for Windows: https://git-scm.com (use the default options;
   make sure your SSH key is added to GitHub).
3. Clone the repo:
   ```
   git clone git@github.com:Tommickey2020gmail/myWebsite.git C:\path\to\myWebsite
   ```
4. Open Obsidian → "Open folder as vault" → select `C:\path\to\myWebsite`.
5. Settings → Files & Links → Excluded files: add the following so the
   file pane focuses on `src/content/`:
   ```
   node_modules/
   dist/
   .astro/
   public/
   src/components/
   src/layouts/
   src/pages/
   src/styles/
   src/lib/
   ```
6. Settings → Community plugins → Browse → install **Obsidian Git** by
   denolehov.
7. Configure Obsidian Git:
   - Vault backup interval: 0 (manual — you decide when to publish)
   - Auto pull interval: 10 min
   - Commit message template: `notes: {{date}}`

## Daily flow

1. Open Obsidian, navigate to `src/content/garden/` (or essays / projects /
   etc.).
2. Cmd/Ctrl+N for a new note. Fill the frontmatter — see the schema in
   [`src/content.config.ts`](../src/content.config.ts) and the quick
   reference below.
3. Write.
4. When ready: Ctrl+P → "Obsidian Git: Commit all changes" → "Obsidian Git:
   Push".
5. Cloudflare Pages auto-builds in ~60 sec; visit https://tommickey.cn.

## Frontmatter quick reference

```yaml
---
title: My note title
description: Optional description for SEO + previews.
lang: zh           # or en — defaults to zh if omitted
tags: [philosophy, eeg]
created: 2026-04-30
updated: 2026-05-01    # optional
status: seedling       # seedling | budding | evergreen — garden only
draft: false
---
```

Per-collection extras:

| Collection | Extra fields |
|------------|--------------|
| `garden`   | `status` (seedling / budding / evergreen) |
| `projects` | `featured`, `stack: []`, `repo`, `demo` |
| `books`    | `author` (required), `rating` (1-5), `finished` |
| `papers`   | `authors: []`, `venue`, `link` (URL / arXiv:ID / DOI), `doi` |

Filenames become URL slugs (lowercase, no spaces preferred but CJK and
spaces are URL-encoded automatically). Subdirectories become route
segments — `garden/eeg/raw-signal.md` → `/garden/eeg/raw-signal/`.

## Wikilinks & backlinks

Inside any garden or essay markdown you can write Obsidian-style wikilinks:

- `[[Welcome to the garden]]` — resolves by **title** (case-insensitive)
- `[[welcome-to-the-garden]]` — resolves by **filename slug**
- `[[Welcome to the garden|hello]]` — custom display text

Resolved links render with a dotted underline. Unresolved targets render
in red strike-through so typos are visible at a glance.

Each garden / essay detail page automatically lists every other entry that
links to it, under a "Linked from" section. No manual upkeep needed.

Cross-references show up in Obsidian's graph view too (the syntax is the
same), so the local editing experience matches the published site.

## Mobile (optional)

- **iOS:** install **Working Copy** (Git client) + **Obsidian Mobile**;
  link them so commits in Working Copy show up in Obsidian and vice versa.
- **Android:** install **Termux** + Git, or use the GitHub web editor at
  https://github.dev/Tommickey2020gmail/myWebsite for quick edits.

## Troubleshooting

- **Build fails on Cloudflare with "Node version" error:** confirm
  `NODE_VERSION=22.17.1` (or any 22.12+) is set in Pages → Settings →
  Environment variables. Astro 6 requires Node ≥ 22.12.
- **Build fails locally with cryptic errors:** confirm `pnpm --version`
  reports 10.x. `npm install -g pnpm@10` to upgrade.
- **A note doesn't show up:** check `draft: true` isn't set, and the
  filename ends in `.md` (not `.markdown`).
