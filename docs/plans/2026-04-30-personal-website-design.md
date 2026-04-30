# 个人网站设计文档

**日期**: 2026-04-30
**站长**: Tommy (tommickey.cn)
**状态**: 设计已确认，待实施

---

## 1. 目标与定位

### 1.1 核心需求

| 需求 | 设计应对 |
|------|---------|
| 界面让人看着极度舒适 | 数字花园美学 + 暖色系 + 衬线字体 + 大量留白 |
| 每天根据接触/想到的东西新增内容 | 数字花园为主体 + Obsidian 直接同步工作流 |
| 支持手机浏览 | 响应式设计 + Astro 静态生成（移动端性能优先） |
| 吸引眼球 | Hero 动态图谱 + EEG 波纹 + 关系图谱可视化 |
| 让搜索平台获取信息 | 国内外搜索引擎双覆盖 + AI 时代 SEO（llms.txt） |

### 1.2 内容定位

数字花园（Digital Garden）为主，叠加：
- 长文区（Essays）—— 哲学/心理/科幻 用中文，AI/机器人/EEG 用英文
- 作品集（Projects）—— 软硬件、机器人、脑电反馈训练器、AI 项目
- 资源库（Library）—— 读过的书、推荐的论文链接
- Now 页面 —— 当下在做/在想
- About —— 中英双语个人介绍

### 1.3 兴趣领域

哲学 / 计算机软硬件开发 / 机器人 / AI / 脑电生物反馈专注力训练 / 心理学 / 老年痴呆预防 / 科幻小说

---

## 2. 站点架构

### 2.1 域名结构

主站继续使用 `tommickey.cn`（已 ICP 备案），AppCenter 保持独立子域名 `app.tommickey.cn`。

### 2.2 路由地图

```
tommickey.cn
├── /                         首页（Hero + 最新动态 + 精选项目）
├── /now                      Now 页面（当下状态）
├── /about                    关于我（中英双语）
├── /garden                   数字花园（日更主场）
│   ├── /garden/[slug]        单条笔记（含 backlinks）
│   ├── /garden/graph         关系图谱可视化
│   └── /garden/tags          标签云 / 主题归档
├── /essays                   长文区
│   ├── /essays/zh            中文长文（哲学/心理/科幻）
│   └── /essays/en            English essays（AI/robotics/EEG）
├── /projects                 作品集
│   └── /projects/[slug]      单个项目详情页
├── /library
│   ├── /library/books        读过的书 + 短评
│   └── /library/papers       论文 / 长文链接归档
├── /rss.xml                  全站 RSS（按区块还有 /garden/rss.xml 等）
├── /sitemap.xml              自动生成
├── /robots.txt               爬虫规则
└── /llms.txt                 AI 爬虫友好声明
```

---

## 3. 视觉设计

### 3.1 调性

数字花园美学（暖色衬线为主）+ 暗色科技风（可切换）。

### 3.2 设计 Token

```
亮色模式（白天/默认）
─────────────────────────
背景  : #FAF8F3（暖米白）
文字  : #1F1A17（深棕）
强调  : #B85C38（陶土橘）
辅助  : #5C8A6B（苔绿）

暗色模式（夜间）
─────────────────────────
背景  : #0E1116（深石墨）
文字  : #E5E1D8（暖白）
强调  : #7DD3FC（脑电蓝）
辅助  : #C084FC（神经紫）

字体
─────────────────────────
正文  : Noto Serif SC（中）+ Cardo / EB Garamond（英）
标题  : 霞鹜文楷 LXGW WenKai（中）+ Fraunces（英）
代码  : JetBrains Mono / 思源等宽
```

### 3.3 三个吸睛元素

**A. Hero 动态图谱背景**
- D3-force 或 Three.js 实现漂浮的概念节点
- 节点为兴趣关键词（"哲学""神经科学""机器人"…）
- 鼠标靠近会轻微吸附震动
- 暗色冷蓝紫，亮色淡米色低对比

**B. EEG 波形装饰线**
- section 分隔处使用真实风格的脑电波纹
- 缓慢横向滚动，hover 时响应
- 仅此处使用的"个人视觉语言"

**C. 关系图谱页（/garden/graph）**
- 所有笔记为节点，双链为边
- 主题颜色编码（哲学=橙、AI=蓝、心理=紫…）
- 数字花园的"灵魂页"

**移动端适配**：图谱在手机上简化为静态预览图，动画频率降低。

---

## 4. 技术栈

```
框架       : Astro 5.x
样式       : Tailwind CSS 4 + 自定义设计 token
内容源     : Obsidian vault（用户已有，仅 publish/ 子目录被发布）
内容同步   : 自研脚本 obsidian-sync.ts（双链 [[...]] → Astro 链接）
交互组件   : React 岛屿（仅图谱、搜索等局部）
图谱       : Cosmograph 或 D3-force
搜索       : Pagefind（静态全文搜索）
评论       : Waline（无需注册，匿名昵称即可，中文圈主流）
统计       : Umami（自托管，隐私友好）
托管       : Cloudflare Pages（主）+ 国内备用节点（如需）
CDN        : Cloudflare（免费）
OG 图生成  : satori（自动渲染分享卡片）
```

---

## 5. 内容工作流

### 5.1 Obsidian → 网站

```
1. 在 Obsidian 中写笔记
   - 文件放在 vault 的 publish/ 子目录
   - frontmatter: lang: zh/en, type: garden/essay/project/book
   - 双链 [[某概念]] 自动转为站内链接

2. 同步到网站仓库
   - 运行 npm run sync
   - 或配置 Obsidian Git 插件自动 commit

3. 一键发布
   - git push → Cloudflare Pages 自动构建部署
   - 全程 30-60 秒
```

### 5.2 Frontmatter 规范

```yaml
---
title: 笔记标题
slug: optional-custom-slug
lang: zh   # zh | en
type: garden   # garden | essay | project | book | paper | now
tags: [philosophy, eeg]
created: 2026-04-30
updated: 2026-04-30
status: seedling   # seedling | budding | evergreen（数字花园成熟度）
draft: false
description: 可选，否则自动取首段 160 字
cover: optional/image.jpg
---
```

### 5.3 手机端发布

- iOS：Working Copy + Obsidian Mobile，手机写完直接 push
- Android：Termux + Obsidian + git，或 GitHub 网页版直接编辑

---

## 6. SEO 策略（国内外双覆盖）

### 6.1 技术 SEO（一次性配置）

- 静态生成（Astro 默认，比 SPA 快 10×）
- 自动 sitemap.xml（@astrojs/sitemap）
- 自动 robots.txt
- hreflang 标签（中英双版本互相声明）
- JSON-LD 结构化数据（Person + BlogPosting）
- Open Graph + Twitter Card
- Lighthouse 100 分目标
- 语义化 HTML5

### 6.2 国内搜索引擎专项

- 百度站长平台提交 sitemap
- 必应站长（含国内必应）
- 神马 / 搜狗 / 头条搜索
- Cloudflare 国内访问优化（必要时上备用国内节点）

### 6.3 国际搜索引擎

- Google Search Console
- Bing Webmaster
- DuckDuckGo（自动从 Bing 抓取）

### 6.4 内容级 SEO（自动应用）

- 自动生成 description（首段 160 字）
- 文件名 → URL slug（中文标题转拼音 + 英文关键词）
- 自动生成 og:image（satori 渲染）
- 文章末尾相关推荐（基于标签）
- canonical URL

### 6.5 AI 搜索时代红利

- llms.txt 协议
- 每篇文章提供 .md 端点（AI 爬虫友好）
- OpenGraph article:author（让 ChatGPT/Perplexity 引用时带上作者）

---

## 7. 实施路线图

### Phase 1 · MVP 上线
1. 初始化 Astro + Tailwind + 基础布局
2. 配置 Content Collections：garden / essays / projects / library / now
3. 编写 obsidian-sync.ts 同步脚本（含双链解析）
4. 实现亮/暗双主题 + 中英双语切换
5. 部署到 Cloudflare Pages，绑定 tommickey.cn
6. 基础 SEO（sitemap、robots、hreflang、Open Graph）
7. 写 3-5 篇种子内容（每区块至少 1 篇）

**完成标志**：可上线、可日更、可被搜索。

### Phase 2 · 数字花园核心体验
8. 双向链接展示（笔记底部 backlinks）
9. Pagefind 全文搜索
10. 标签系统 + 标签云
11. RSS 订阅（区块独立 + 全站合并）
12. Waline 评论集成

### Phase 3 · 视觉吸睛
13. Hero 动态图谱背景
14. EEG 波纹分隔线
15. /garden/graph 交互关系图谱
16. 自动 og:image 生成（satori）
17. 阅读进度条 + 平滑滚动 + 微动效

### Phase 4 · SEO 深耕 & AI 准备
18. JSON-LD 结构化数据
19. 提交百度 / 必应 / 谷歌站长平台
20. llms.txt + .md 端点
21. Umami 自托管统计
22. 国内备用节点（按需）

### Phase 5 · 持续优化（永续）
- 每周：回顾点击数据，补全冷门主题
- 每季度：将成熟 garden 笔记升级为 essays
- 每年：发布"年度回顾"长文（强 SEO 价值）

**总计预估**：Phase 1 集中 2-3 天能上线；Phase 2-3 各 1-2 天；Phase 4 半天起。3 周内完整体验全部到位。

---

## 8. 待办与开放问题

- [ ] 确认 Obsidian vault 当前路径（用于配置同步脚本）
- [ ] 确认是否需要立即开发 AppCenter 风格的国内备用节点
- [ ] 选择具体的 Umami 自托管位置（VPS / Cloudflare Workers）
- [ ] Waline 后端选择（LeanCloud 免费版 / 自托管 Vercel）

---

## 9. 关键决策记录

| 决策点 | 选择 | 理由 |
|-------|------|------|
| 站点定位 | 数字花园 + 多区块 | 最匹配"日更碎片想法" |
| 写作工作流 | Obsidian + 同步脚本 | 已有 vault，零迁移成本 |
| 视觉风格 | 数字花园美学（C） | 兼顾舒适与思考感 |
| 语言策略 | 中英按主题分（D） | 写作顺畅 + 双向 SEO |
| 框架 | Astro（B） | 完全可控，吸睛元素无限制 |
| 评论 | Waline | 无需注册，中文圈主流 |
| 搜索引擎 | 国内外双覆盖 | 用户明确要求 |
