---
title: Obsidian → Astro publish pipeline
description: How this digital garden actually gets from a Windows laptop into Cloudflare Pages.
lang: en
created: 2026-05-02
stack: [Obsidian, Git, Astro, GitHub, Cloudflare Pages]
repo: https://github.com/Tommickey2020gmail/myWebsite
tags: [meta, web, writing, tools]
---

This isn't a separate project so much as the **content workflow** for
[[tommickey.cn (this site)]]. Documenting it as a project because the
workflow itself is reusable.

## Constraints

- Writing happens on Windows 11 in Obsidian (native CJK input, links,
  graph view).
- Building / deploying happens on Linux (this Ubuntu machine).
- Two devices, one source of truth.
- No Obsidian-Sync or other paid sync; everything goes through Git.

## The pipeline

```
┌────────────────┐       git push       ┌──────────────┐
│  Obsidian      │  ──────────────────► │  GitHub      │
│  vault on Win  │                      │  main branch │
│  (= /src/cont) │                      └──────┬───────┘
└────────────────┘                             │
                                               │  webhook
                                               ▼
                                       ┌──────────────────┐
                                       │  Cloudflare      │
                                       │  Pages build     │
                                       │  (pnpm build)    │
                                       └──────┬───────────┘
                                              │
                                              ▼
                                       tommickey.cn
```

The Obsidian vault and `src/content/` are the **same directory**. Open
the repo as the vault, and every note you create is already in the
right place to be published. No copy step, no export step.

## Subtle bits that took time

- **Wikilinks** had to be implemented as a remark plugin (see
  `src/lib/wikilinks.ts`) because Astro doesn't support `[[...]]`
  natively. Resolution goes through a title/slug registry built once
  per build.
- **Backlinks** require scanning every entry's raw markdown body
  before render. Module-cached so it's done exactly once.
- **CJK / spaced filenames** survive because all internal links go
  through `slugHref(entry.id)` which encodes per-segment but preserves
  `/`. Obsidian-on-Windows generates filenames like
  `什么是数字花园.md`; the URL becomes
  `/essays/%E4%BB%80%E4%B9%88...`. Works in browsers and search
  engines.
- **Content collections** declare schemas with Zod. Frontmatter typos
  fail the build before they reach the world.

## What I'd do differently if starting today

- Start with `astro:content` from day 1 (not retrofit it).
- Decide on the trailing-slash convention **before** writing 30
  internal links by hand. (Locked into `directory` format here.)
- Write the wikilinks plugin first, before letting any prose
  accumulate, so you don't have to backfill broken `[[X]]` later.

See also: `docs/obsidian-setup.md` in the repo for the Windows
checklist.
