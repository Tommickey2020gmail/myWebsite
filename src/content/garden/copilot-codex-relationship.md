---
title: 一句话概括 Copilot 与 Codex 的关系
title_en: Copilot and Codex in one sentence
description: 同源、异路、现在正面竞争——Copilot 当年靠 Codex 起家，如今却分属微软和 OpenAI 两家，而"Codex"这个名字本身还被复用过一次。
description_en: Same origin, diverged paths, now competitors — Copilot grew out of Codex but now belongs to Microsoft while OpenAI revived the "Codex" name for an entirely different product.
lang: zh
status: seedling
created: 2026-06-02
tags: [ai, coding-agents, copilot, codex, openai, microsoft]
---

一句话概括 Copilot 和 Codex 的关系：**它们同源但现在是竞争对手**——Copilot 当年是靠 Codex 起家的，如今却成了分属微软和 OpenAI 两家、相互竞争的产品，而 "Codex" 这个名字本身还被复用过一次，是这个领域几乎所有混淆的根源。

展开说有三层关系。

## 第一层：血缘起源

GitHub Copilot 在 2021 到 2023 年间正是由最初那个 Codex 模型驱动的。也就是说，Copilot 最早的代码补全能力，底层跑的就是 OpenAI 2021 年那个 GPT-3 微调出来的 Codex。这是两者真正的"亲缘"——Copilot 是 Codex 模型的第一个杀手级应用。

## 第二层：名字复用造成的混淆

这里要特别小心，因为 "Codex" 指过两个完全不同的东西。

2023 年之后，微软和 GitHub 把 Copilot 切换到了 GPT-4o，并远远超越了它最初的自动补全定位；而老的 Codex 模型则被弃用了。然后 OpenAI 在 2025 年 5 月用 "Codex" 这个名字推出了一个完全不同的东西——一个基于 o3/o4-mini 的云端自主编码智能体，它和原来的 Codex 在架构和工作流上没有任何共享，只是名字被复用了。

所以今天你说 "Codex 和 Copilot"，其实是在比较 **OpenAI 的新一代云端智能体** 和 **微软的 Copilot**，而不是那个老模型。

## 第三层：如今的竞争与归属

两者已经分道扬镳，体现的是两种哲学：

- **Copilot** 是微软/GitHub 的产品，根基仍是编辑器内的实时辅助——边打字边给补全建议，然后才扩展到智能体能力。关键是它早已不绑定单一供应商：它的模型选择器现在同时提供 GPT-5.4、GPT-5.5，以及 Anthropic 的 Claude（Pro+ 套餐可用 Opus）和谷歌的 Gemini。
- **Codex** 是 OpenAI 自家的产品，是云端异步的自主智能体——你委派任务，它在隔离沙箱里克隆仓库、独立完成、最后给你一个 PR。

这里有个很有意思的反讽：**Codex 既是 Copilot 的竞争对手，又是 Copilot 里可选的一个模型**。也就是说微软一边和 OpenAI 竞争编码工具市场，一边又在 Copilot 里接入 OpenAI（以及 Claude）的模型。这背后反映的是微软在战略上对 OpenAI 依赖的对冲——通过引入 Claude、Gemini，Copilot 不再把自己的命运拴在一家模型供应商上。

商业模式也分化了：GitHub 宣布所有 Copilot 套餐从 2026 年 6 月 1 日起转向用量计费，每个套餐含一定额度的 GitHub AI Credits，代码补全和 Next Edit 建议仍不计量；Codex 则走 ChatGPT 订阅 + 按量付费的 API 路线。值得一提的是，Copilot 向智能体工作流的快速演进让其算力需求剧增，以至于 GitHub 在 2026 年 Q2 暂停了新的个人注册以维持服务稳定。

## 心智模型

Codex 是 Copilot 的"生父留下的同名后代"——它继承了 OpenAI 的模型血统，但被 OpenAI 自己做成了一个独立、对标 Copilot 和 [[Claude Code|Claude Code]] 的自主智能体；而 Copilot 早已"另立门户"，成了一个多模型、深度绑定 GitHub/微软生态的平台。

**同根、异路、现在正面竞争。**
