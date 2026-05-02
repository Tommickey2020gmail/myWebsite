---
title: 内语引擎（ISE）
title_en: Inner Speech Engine (ISE)
description: 一个基于维果茨基"内语"理论的 AI 审议框架，回答"是否要行动"的问题。
description_en: A Vygotsky-inspired deliberation framework for AI agents — answering whether to act, not just how.
lang: zh
created: 2026-04-30
featured: true
repo: https://github.com/Tommickey2020gmail/inner-speech-engine
stack: [Python, litellm, Pydantic v2, Jinja2, SQLite, scikit-learn]
tags: [ai, cognitive-science, philosophy, consciousness]
---

> Inner Speech Engine: Vygotskian Self-Dialogue for AI Intent Deliberation
> 论文（Markdown）：[ISE_Paper.md](https://github.com/Tommickey2020gmail/inner-speech-engine/blob/main/docs/paper/ISE_Paper.md) · 仓库：[github.com/Tommickey2020gmail/inner-speech-engine](https://github.com/Tommickey2020gmail/inner-speech-engine)

## 论文要解决的问题

LLM 智能体越来越自主，但缺一个原则性的机制来决定**是否**该行动。一个个人助理察觉到明天有重要面试——它该不该提醒？答案取决于一连串细微判断：用户是否已经知道？现在打扰是否合时？提醒是被欢迎还是冒犯？

现有架构对"该不该做"无能为力。规则系统刻板触发；ReAct 决定怎么做、不决定要不要做；Reflexion 是事后反思——动作已经发生。**该不该**这一层结构性审议，至今没有专门的脚手架。

## 框架：四阶段自我对话

ISE 把维果茨基的内语理论搬到 LLM 上，分四个阶段：

```
α: Self-Questioning   —— 生成 5–7 个评估问题
β: Self-Argumentation —— 对每个问题做正反论证 + 0–1 评分
γ: Self-Challenging   —— 对自己的论证做对抗性盘问
δ: Self-Deciding      —— 加权聚合 + 阈值 → ACT / ABSTAIN
```

| 认知功能 | 内语表现 | ISE 阶段 |
|---|---|---|
| 自我调控 | "我该考虑什么？" | Self-Questioning |
| 评估 | "正反两面都是什么？" | Self-Argumentation |
| 对话式换位 | "如果我错了呢？" | Self-Challenging |
| 执行决断 | "权衡之下我该不该……" | Self-Deciding |

研究了五种实现变体：ISE-Full（4 次 LLM 调用，把四阶段拆开）、ISE-Internalized（1 次调用，把四阶段封装在同一个 prompt 里）、ISE-Gated（自适应 1–5 次调用）、ISE-NoChallenge、ISE-Compressed。

## 基准：PIDB

**Proactive Intent Deliberation Benchmark**：219 个人工标注的场景，三类——

- **Clear-Act**（94）：明显该介入
- **Clear-Abstain**（67）：明显不该介入
- **Ambiguous**（58）：边界情况，需要细腻判断

标注者一致性：κ = 0.844（主集合），κ = 0.600（模糊扩展）。

## 核心发现

| 方法 | F1 | FPR | Recall |
|---|---|---|---|
| **ISE-Internalized** | **0.907** | 0.274 | **0.970** |
| Chain-of-Thought | 0.899 | 0.143 | — |
| Direct Prompting | 0.897 | 0.179 | — |
| ISE-Gated | 0.872 | 0.179 | — |
| ISE-Full | 0.855 | 0.238 | — |

**认知脚手架是有价值的，但多阶段拆分不是。** 把四阶段封装在**单次**调用内（ISE-Internalized）显著优于把它们拆成四次调用（ISE-Full）。Bootstrap 95% CI for ΔF1 在两个测试模型上都不跨零（[+0.007, +0.081] / [+0.010, +0.111]）。在模糊场景上，对 Direct Prompting 的优势在 Qwen 上达到统计显著（McNemar's *p* = 0.031）。

这恰好镜像了维果茨基的发展轨迹：**内化的内语优于外化的自我中心言语**。

## 两个副产品级的发现

**1. 严重性锚定效应**——把一个标量"挑战严重度"（0–1）从 γ 阶段传给 δ 阶段时，下游 LLM 会过度依赖这一个数字，忽略丰富的定性证据。把它换成结构化定性总结（"7 个维度里有 5 个支持行动"）后，F1 从 0.857 升到 0.901。这是 Tversky & Kahneman（1974）锚定偏差在多阶段 LLM pipeline 内的一次现身。

**2. 自我反思悖论**——Self-Refine、Reflexion 风格的迭代自我批评，在 Doubao / Qwen 上**低于** Direct Prompting，在显然不该行动的场景上 FPR 高达 33–37%。机制：当初始判断已经正确（ABSTAIN），迭代批评会生造出"为什么或许该行动"的假设性理由，让模型把自己**说服**到错误答案。

## 为什么内化打败拆分

两个互补的机制：

- **信息瓶颈**：每一次阶段间的序列化都是有损压缩。δ 阶段拿到的是约 500 token 的结构化摘要，原始 ~1,000 token 的用户上下文已经被丢掉了一半。
- **注意力窗口**：在 ISE-Internalized 里，LLM 在生成 δ 段落时仍在原始情境上注意；ISE-Full 的 δ 阶段只能看见前置阶段的产物，无法回溯校验"用户真的会欢迎吗？"这类问题。

设计建议：当全部审议上下文能塞进单次调用窗口时，**默认走内化**，只在上下文超窗或必须中间可观测时才拆分。

## 与维果茨基的呼应

成熟的内语是**缩略**的——成年人会丢掉儿童才需要明说的冗余阐述。我们的消融实验也呼应这一点：在内化形式里，Self-Argumentation 这一步并不带来 F1 增益。当 Questioning 与 Challenging 已经存在时，显式的正反论证就像儿童把心里的话说出口——多余的外部化。**最佳脚手架不是最详尽的，而是激活相关认知功能所需的最小结构。**

技术栈：Python 3.11+ · litellm · Pydantic v2 · Jinja2 · pytest。

写作过程本身的几次反转和哲学反思，搬到了一篇随笔里：[[taking-down-the-scaffolding|把脚手架拆下来]]。

交叉链接：[[The loop and the self|循环与自我]]、[[Predictive processing 101]]、[[Attention as relation, not state]]。

---

## English

> Inner Speech Engine: Vygotskian Self-Dialogue for AI Intent Deliberation
> Paper (Markdown): [ISE_Paper.md](https://github.com/Tommickey2020gmail/inner-speech-engine/blob/main/docs/paper/ISE_Paper.md) · Repo: [github.com/Tommickey2020gmail/inner-speech-engine](https://github.com/Tommickey2020gmail/inner-speech-engine)

## The problem

LLM agents are increasingly autonomous, yet lack a principled mechanism for deciding **whether** to act. A personal assistant detects an important interview tomorrow — should it proactively remind the user? The answer depends on subtle factors: does the user already know, is now a good time, would the reminder be welcome or intrusive?

Existing architectures handle this poorly. Rule-based systems trigger rigidly. ReAct decides what to do, not whether. Reflexion does post-hoc reflection — the act has already happened. There is no dedicated scaffolding for the **should-I** layer.

## Framework: four-stage self-dialogue

ISE operationalises Vygotsky's inner speech theory into four cognitive stages:

```
α: Self-Questioning   → generates 5–7 evaluation questions
β: Self-Argumentation → pro/con reasoning per question, scores 0.0–1.0
γ: Self-Challenging   → adversarial self-examination
δ: Self-Deciding      → weighted aggregation + threshold → ACT / ABSTAIN
```

| Cognitive function | Inner-speech form | ISE stage |
|---|---|---|
| Self-regulation | "What should I consider?" | Self-Questioning |
| Evaluation | "What are the reasons for/against?" | Self-Argumentation |
| Dialogic perspective-taking | "But what if I'm wrong?" | Self-Challenging |
| Executive decision | "On balance, I should/shouldn't…" | Self-Deciding |

Five implementation variants studied: ISE-Full (4 LLM calls), ISE-Internalized (1 call), ISE-Gated (1–5 calls adaptive), ISE-NoChallenge, ISE-Compressed.

## Benchmark: PIDB

**Proactive Intent Deliberation Benchmark** — 219 human-annotated scenarios in three categories:

- **Clear-Act** (94): proactive intervention is appropriate
- **Clear-Abstain** (67): intervention should be withheld
- **Ambiguous** (58): borderline, needs nuanced judgement

Inter-annotator agreement: κ = 0.844 (main), κ = 0.600 (ambiguous expansion).

## Headline finding

| Method | F1 | FPR | Recall |
|---|---|---|---|
| **ISE-Internalized** | **0.907** | 0.274 | **0.970** |
| Chain-of-Thought | 0.899 | 0.143 | — |
| Direct Prompting | 0.897 | 0.179 | — |
| ISE-Gated | 0.872 | 0.179 | — |
| ISE-Full | 0.855 | 0.238 | — |

**Cognitive scaffolding is valuable, but multi-stage decomposition is not.** Wrapping the four stages inside a **single** call (ISE-Internalized) significantly outperforms decomposing them into four calls (ISE-Full). Bootstrap 95% CIs for ΔF1 exclude zero on both tested models ([+0.007, +0.081] / [+0.010, +0.111]). On ambiguous scenarios, ISE-Internalized's advantage over Direct Prompting reaches significance on Qwen (McNemar's *p* = 0.031).

This mirrors Vygotsky's developmental trajectory: **internalised inner speech outperforms externalised egocentric speech**.

## Two by-product findings

**1. The severity anchor effect.** Passing a single scalar "challenge severity" (0–1) from γ to δ caused the downstream LLM to over-weight that one number, ignoring the rich qualitative evidence alongside it. Replacing it with a structured qualitative summary ("5 of 7 dimensions favour acting") improved F1 from 0.857 to 0.901. This is Tversky & Kahneman's (1974) anchoring bias surfacing inside a multi-stage LLM pipeline.

**2. The self-reflection paradox.** Self-Refine and Reflexion-style iterative self-critique **underperform** Direct Prompting on Doubao / Qwen, with FPR up to 33–37% on obviously-abstain scenarios. The mechanism: when the initial answer is correct (ABSTAIN), iterative critique generates hypothetical reasons why action *might* be warranted — and the model talks itself into the wrong answer.

## Why internalisation beats decomposition

Two complementary mechanisms:

- **Information bottleneck.** Each inter-stage serialisation is a lossy compression. The δ stage receives ~500 tokens of structured summary; ~1,000 tokens of original user context have been thrown away.
- **Attention window.** In ISE-Internalized the LLM still attends to the original scenario while generating the deciding paragraph. In ISE-Full, δ sees only the artefacts of prior stages and cannot verify questions like "would the user actually welcome this?"

Design recommendation: when full deliberation context fits in one call, **default to internalisation**. Decompose only when context exceeds the window or intermediate inspectability is a hard requirement.

## Echoing Vygotsky

Mature inner speech is **abbreviated** — adults drop redundant elaboration that children have to say aloud. Our ablations echo this: in the internalised form, Self-Argumentation does not improve F1. When Questioning and Challenging are already present, explicit pro/con generation is like a child speaking the inner monologue out loud — redundant externalisation. **The best scaffolding is not the most elaborate one but the minimum structure needed to activate the relevant cognitive functions.**

Stack: Python 3.11+ · litellm · Pydantic v2 · Jinja2 · pytest.

Companion essay on the reversals encountered while writing the paper: [[taking-down-the-scaffolding|Taking down the scaffolding]].

Cross-links: [[The loop and the self]], [[Predictive processing 101]], [[Attention as relation, not state]].
