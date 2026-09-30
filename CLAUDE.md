# myWebsite — 项目约定

个人数字花园，Astro 6 + Tailwind 4 + TypeScript strict + Content Collections，部署在 Cloudflare Pages。
**仓库是 PUBLIC 的** —— 任何私密内容（凭据、家人/客户资料、未公开项目设计）都不许进来。

## 环境（不照做会直接失败）

- **Node 22 强制**：任何 pnpm / astro 命令前先 `nvm use 22.17.1`。本机默认 `node` 是 v20.18.1，Astro 6 要求 ≥22.12，不切版本直接报错。
- 包管理器是 **pnpm v10**（不是 v9）。Cloudflare Pages 侧环境变量 `PNPM_VERSION=10`。
- 构建：`pnpm build`。在 Claude Code 沙箱下需要 `dangerouslyDisableSandbox: true`。

## 路由（最容易犯的错）

- `build.format: 'directory'` ⇒ **所有站内 href 必须以 `/` 结尾**（`/garden/`、`/essays/foo/`）。漏了会吃一次 301，sitemap 也带尾斜杠，两边必须一致。
- 条目详情页链接用 `slugHref(entry.id)`（`src/lib/url.ts`）——文件名可能含空格 / 中文（Obsidian 在 Windows 上写的），它按段编码但保留 `/`。**不要自己重新 slug 化。**
- 动态路由 `[...slug].astro` 里 `slug` 直接取 `entry.id`，这样 Astro 自动编码的路径才和 `slugHref` 生成的链接对得上。
- 论文链接用 `paperHref(link, doi)` 归一化（接受 URL / `arXiv:ID` / 裸 DOI）。
- 书和论文**没有详情页**，在 `/library/` 内联展开，深链用 `/library/#book-<slug>` / `#paper-<slug>`，不要对它们用 wikilink。

## 样式

- 用 `@theme` 自动生成的短工具类：`text-muted` / `text-fg` / `text-accent` / `border-border`。
  **不要写 `text-[color:var(--color-muted)]`** —— 更啰嗦，生成的 CSS 完全一样。
- 标题**不要加 `font-serif`**。`global.css` 已给 h1–h5 全局设了 `font-display`（Fraunces），加 Tailwind 的 `font-serif` 会盖成 Cardo。
- 外链：`target="_blank" rel="noopener noreferrer"`，`↗` 包在 `<span aria-hidden="true">` 里，`aria-label` 以 `(opens in new tab)` 结尾。

## 双语

正文和标签统一这个结构，靠 `html[data-lang]` 切换显隐：

```html
<span lang="zh">中文</span><span class="biling-sep" aria-hidden="true"> / </span><span lang="en">English</span>
```

Markdown 正文由 `src/lib/lang-split.ts`（rehype 插件）按 `---` + `## English` 边界自动包 `<section lang="…">`。

## 写作口味

**→ `docs/voice.md`。写任何文章正文之前先读它。** 那里记的是作者本人的判断，不是通用文风建议。

## 提交纪律

- **只 `git add <具体文件>`，永远不要 `git add -A`。** 工作区常年躺着未跟踪的草稿和散图。
- `.env` 绝不入库（已 gitignore，但别用 `-f` 绕）。
- 提交信息用中文，格式 `<板块>: <做了什么>`（如 `essays: publish either-is-fine`、`site: 人读版站点地图`）。

## 发布

走 `/website:publish`，不要手搓。它串起：配图（`pnpm gen:images <md> --provider=ark`）→ 音频（`pnpm gen:audio`）→ `pnpm build` 验证 → 提交推送 → 百度主动推送（配额 10 条/天）。
