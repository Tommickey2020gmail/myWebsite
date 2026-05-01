---
title: Obsidian → Astro 发布流水线
title_en: Obsidian → Astro publish pipeline
description: 这个数字花园是怎么从一台 Windows 笔记本进入 Cloudflare Pages 的。
description_en: How this digital garden actually gets from a Windows laptop into Cloudflare Pages.
lang: zh
created: 2026-05-02
stack: [Obsidian, Git, Astro, GitHub, Cloudflare Pages]
repo: https://github.com/Tommickey2020gmail/myWebsite
tags: [meta, web, writing, tools]
---

这与其说是一个独立项目，不如说是 [[tommickey.cn (this site)|tommickey.cn（本站）]] 的**内容工作流**。把它作为项目记录是因为这套工作流本身可被复用。

## 约束

- 写作发生在 Windows 11 + Obsidian 上（中文输入、双链、关系图都原生支持）。
- 构建/部署发生在 Linux 上（这台 Ubuntu 机器）。
- 两台设备，一个唯一真源。
- 不用 Obsidian-Sync 或任何付费同步；一切走 Git。

## 流水线

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

Obsidian 的 vault 与 `src/content/` 是**同一个目录**。把仓库当 vault 打开，每条新建的笔记就已经在正确的位置上等待发布。无需复制步骤，无需导出步骤。

## 花了时间的细节

- **Wikilinks** 必须实现为一个 remark 插件（见 `src/lib/wikilinks.ts`），因为 Astro 不原生支持 `[[...]]`。解析走一个每次构建一次性建立的 title/slug 注册表。
- **反向链接**需要在渲染前扫描每篇 entry 的原始 markdown body。模块级缓存以保证只跑一次。
- **CJK / 含空格的文件名**之所以能活下来，是因为所有内部链接都走 `slugHref(entry.id)`，它逐段编码但保留 `/`。Windows 上的 Obsidian 会生成像 `什么是数字花园.md` 的文件名；URL 变成 `/essays/%E4%BB%80%E4%B9%88...`。浏览器和搜索引擎都吃。
- **Content collections** 用 Zod 声明 schema。frontmatter 笔误在抵达世界前就让构建失败。

## 如果今天重新开始我会怎么做

- 第 1 天就用 `astro:content`（不要后来再改）。
- **在手写 30 个内部链接之前**就决定 trailing-slash 约定。（这里锁死在 `directory` 模式。）
- 在让任何文章累积之前先写 wikilinks 插件，免得回过头补一堆坏掉的 `[[X]]`。

参见：仓库里的 `docs/obsidian-setup.md` Windows 检查清单。

---

## English

This isn't a separate project so much as the **content workflow** for
[[tommickey.cn (this site)|tommickey.cn（本站）]]. Documenting it as a project because the
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
