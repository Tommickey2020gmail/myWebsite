---
title: tommickey.cn（本站）
title_en: tommickey.cn (this site)
description: Astro 6 + Tailwind 4 + Obsidian 为内容源的双语数字花园，自部署 Waline 评论。
description_en: Astro 6 + Tailwind 4 digital garden with Obsidian as the content source and self-hosted Waline comments.
lang: zh
created: 2026-04-30
updated: 2026-05-03
featured: true
stack: [Astro 6, Tailwind 4, TypeScript, Cloudflare Pages, Cloudflare Tunnel, Obsidian, Waline, SQLite]
repo: https://github.com/Tommickey2020gmail/myWebsite
tags: [meta, web, digital-garden]
---

你正在阅读的这个网站。源码可见，内容开放。

不是博客模板，是一座数字花园——笔记会被持续修剪，文章会跟新的想法回头打架，项目页随实际进度更新而不是发布完就僵死。

## 现状

- 内容分七类：[[garden]]（笔记）、[[essays]]（成文）、[[projects]]（项目）、`books`、`papers`、`now`、`tags`。前三类有独立详情页，书与论文在 `/library/` 内联展开。
- 双语切换：右上角一键 zh / en，全站段落级显隐。每篇 markdown 用 `## English` 分隔后段，由 rehype 插件包到 `<section lang>` 里。
- 评论已上线：自部署 Waline（Docker + SQLite + Cloudflare Tunnel），无注册即可发；只在详情页懒加载，不进首屏。
- Wikilinks + 反链：`[[标题]]` 或 `[[slug|别名]]` 解析后，每篇底部自动列出"Linked from"。
- 阅读时长（CJK 400 cpm + Latin 250 wpm）、Seedling 状态徽章、Hero 力学图、EEG 频带可视化（全部纯 SVG，遵循 prefers-reduced-motion）。
- 客户端搜索（静态 JSON 索引、`/` 快捷键、命中高亮）、随机笔记跳转、tag 索引、404 真返回 404。
- SEO 基础完整：sitemap、RSS、robots.txt、llms.txt、Schema.org JSON-LD（首页 + 文章页）、OG 卡、打印样式。
- 暗色模式：基于 class 的 Tailwind 4 dark variant，prose 内容也跟随翻转。
- 已 ICP 备案，CSP/HSTS/Referrer-Policy 等安全响应头默认开。

## 写作流（关键设计）

- Obsidian 直接打开 `src/content/` 当 vault；wikilinks 在编辑器和构建后都成立。
- Windows 笔记本写作 → Obsidian Git 推送 → Cloudflare Pages 自动构建。
- 服务端没有数据库（除评论用的 SQLite）；笔记以 git 为唯一真源。
- 评论后端跑在自家 Linux 服务器上，通过 Cloudflare Tunnel 暴露到 `comment.tommickey.cn`，避开开 80/443 端口和申请 Origin Cert。

详情参见 [[Obsidian → Astro 发布流水线]] 和 `docs/comments-deploy.md`。

## 技术取舍

- **Astro 6 over Next**：纯静态、零客户端 JS 默认值、内容集合 + Zod schema 校验、构建快。Next 太重。
- **Tailwind 4 token utilities**：所有颜色走 `@theme` token，不用 `text-[color:var(...)]` 长形式；暗色靠 `dark:` 变体一行搞定。
- **Cloudflare Pages over Vercel**：CN 友好（Cloudflare 在国内有节点合规可用）+ 已经在 CF 管 DNS。
- **Waline over Giscus/Disqus**：Giscus 要登录 GitHub，门槛太高；Disqus 隐私差还插广告。Waline 自部署、无注册、SQLite 一文件备份。
- **Obsidian 而非 CMS**：不写后台等于零运维负担；本地编辑可断网工作；图谱视图天然适合花园式写作。

## 限制

- 中英内容靠手写两份，没机翻；新增笔记若英文部分缺失，前端会优雅隐藏（不会露空标签）但 SEO 上失去 en-US 信号——目前 hreflang 只声明 zh-CN + x-default 不撒谎。
- 没有评论审核 UI 之外的反垃圾机制；Waline 自带的频率限制和邮件通知够个人站用。
- 静态站，没有"草稿预览"模式；想看效果就本地 `pnpm dev`。
- 搜索是 client-side，索引随 build 嵌入；规模上千篇时该考虑切到外部服务。

## 接下来

- 多看时间打磨内容，少改样式。
- 评论后台脚本化备份（已自动 git 提交 SQLite 到私有仓）。
- 给 books/papers 加更结构化的 BibTeX 导出。

---

## English

The site you're reading. Source available, content open.

Not a blog template — a digital garden. Notes get pruned. Essays argue with newer thinking. Project pages update with real progress, not freeze at launch.

### What's live

- Seven content kinds: garden notes, essays, projects, books, papers, now, tags. The first three have detail pages; books and papers expand inline at `/library/`.
- Bilingual toggle: one click in the header flips zh / en across the whole site at the section level. Each markdown file separates the en half with `## English`; a rehype plugin wraps each in `<section lang>`.
- Comments live: self-hosted Waline (Docker + SQLite + Cloudflare Tunnel), no signup required, lazy-loaded on detail pages only.
- Wikilinks + backlinks: `[[title]]` or `[[slug|alias]]` resolves at build, and every entry lists its inbound links.
- Reading time (CJK 400 cpm + Latin 250 wpm), seedling status badge, hero force-graph, EEG band animation — all inline SVG, all honor `prefers-reduced-motion`.
- Client-side search (static JSON index, `/` shortcut, match highlighting), random-note redirect, tag index, real 404 page.
- SEO baseline: sitemap, RSS, robots.txt, llms.txt, Schema.org JSON-LD (home + article pages), OG cards, print stylesheet.
- Class-based Tailwind 4 dark mode that flips prose body too.
- ICP filing complete; CSP/HSTS/Referrer-Policy headers shipped by default.

### Authoring loop

- Obsidian opens `src/content/` directly as a vault; wikilinks resolve in both the editor and the build.
- Write on Windows laptop → Obsidian Git push → Cloudflare Pages auto-build.
- No server-side database except the SQLite for comments. Notes live in git, single source of truth.
- Comment backend runs on a home Linux box, fronted by Cloudflare Tunnel at `comment.tommickey.cn` — no 80/443 exposure, no Origin Cert.

See [[Obsidian → Astro publish pipeline]] and `docs/comments-deploy.md`.

### Trade-offs

- **Astro 6 over Next**: static-first, zero-JS by default, content collections with Zod validation, fast builds. Next felt too heavy.
- **Tailwind 4 token utilities**: every color goes through `@theme` tokens; dark mode is one `dark:` variant away.
- **Cloudflare Pages over Vercel**: CN-friendly edge plus DNS already lives in CF.
- **Waline over Giscus/Disqus**: Giscus needs GitHub login (too high a barrier), Disqus is privacy-hostile. Waline self-hosts, no signup, one-file SQLite backup.
- **Obsidian instead of a CMS**: no backend means no ops; local editing works offline; the graph view fits garden-style writing naturally.

### Limits

- zh and en are hand-authored, no MT. If a new note lacks the English half, the frontend hides it gracefully — but SEO loses the en-US signal, so hreflang currently advertises zh-CN + x-default only (no lies).
- No anti-spam beyond Waline's built-in rate limit and email notifications. Fine for a personal site.
- No draft preview mode; run `pnpm dev` locally to preview.
- Client-side search bundles its index at build time; would need an external service past ~1k entries.

### Next

- Spend time on content, not styling.
- Script comment-backend backups (SQLite already auto-committed to a private git repo).
- Better-structured BibTeX export for books/papers.
