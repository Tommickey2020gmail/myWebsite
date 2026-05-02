---
title: 把脚手架拆下来
title_en: Taking down the scaffolding
description: 写一篇关于内语的论文如何反过来教我——更多结构不等于更好的思考。
description_en: How writing a paper about inner speech taught me back — more structure is not better thinking.
lang: zh
created: 2026-04-30
tags: [philosophy, ai, cognitive-science, writing, meta]
---

我开始写 [[inner-speech-engine|内语引擎]] 这篇论文时，相信一个直觉：**让 AI 想得更清楚的办法，是让它把思考分得更细。**

把"该不该行动"这个判断拆成四个阶段——先生成评估问题（Self-Questioning），再正反论证（Self-Argumentation），再对自己的论证做对抗式盘问（Self-Challenging），最后聚合决断（Self-Deciding）。每一步是一次独立的 LLM 调用，每一步的输出都是结构化的、可读的、可审计的。这看上去像让一台机器"想得更慢、更深"。

它没那么有效。

## 第一次反转：拆得越细，做得越差

我们对照了两个版本：

- **ISE-Full**：四阶段，四次 LLM 调用，每个阶段独立的 prompt
- **ISE-Internalized**：四阶段，**一次** LLM 调用，所有阶段封装在同一个 prompt 里

朴素直觉说，前者更"严谨"——每一步都被显式地外化、评估、传递。后者像作弊，把所有东西塞进一个长 prompt 然后让模型一次性产出。

数据说反话。F1：0.907 vs 0.855。模糊场景上的差距更大。两个模型上的 bootstrap 置信区间都不跨零。

我花了几周才在心里接受这件事。**多阶段拆分不是"更清晰的思考"——它是把思考翻译成更糟糕的格式。**

## 信息瓶颈不是修辞

当 δ 阶段（决断）只能读到前三阶段的结构化摘要——大概 500 token——它就再也看不到原始用户场景里的那 1,000 token。"用户其实早就提醒过自己三次了" 这种句子，在 β 阶段被压成了 score = 0.6，在 γ 阶段又被压成 challenge severity = 0.15，到 δ 时只剩两个数字和一段冷冰冰的总结。

这是信息论意义上的硬伤。**每一次阶段间的序列化都是一次有损压缩，而损失是不可逆的。** 没有提示工程能补回来。

ISE-Internalized 之所以更好，不是因为它更"魔法"，而是因为模型在生成"我决定要不要行动"这一段时，仍然在看着用户原始的话。注意力还在原文上。前三个阶段的输出只是这段文字里早一点的部分——它们没有被剪掉、压扁、重新粘贴。

## 第二次反转：一个数字就能毒化整个流水线

最早版本的 ISE-Full 在 γ 阶段输出一个 0–1 的"挑战严重度"标量，传给 δ。

它把 F1 拉低了 0.044。

不是因为这个数字算错了。是因为下游 LLM **过度依赖**它，把它当成了主要锚点，而忽略了同时摆在面前的丰富定性证据。Tversky 和 Kahneman 1974 年描述的锚定偏差，在 LLM 的 prompt 工程里**原封不动地**重现了。

把这个标量替换成"7 个维度里有 5 个支持行动"这样的结构化定性总结，F1 从 0.857 升到 0.901——少 10 个假阴，多 2 个假阳。

教训远超 ISE 一个项目：**任何在阶段间传递标量摘要的多智能体系统、RAG pipeline、agent chain，都在内部偷偷锚定。** 我现在看到 "confidence: 0.78" 这种字符串出现在 prompt 里，会自动起鸡皮疙瘩。

## 第三次反转：自我反思可以**降低**判断力

我们把 Self-Refine 和 Reflexion 风格的迭代自我批评作为基线放进对照组，预期它们大致和 Direct Prompting 持平、可能略好。

结果在 Doubao 和 Qwen 上，它们**输给** Direct Prompting，在显然不该行动的场景上 FPR 高达 37%。换句话说，让模型反复批评自己的初始判断，会让它把**正确的答案改错**。

机制是这样的：当初始判断已经正确（ABSTAIN），迭代批评会自动生造出"为什么或许该行动"的假设性理由——批评的语法本身就要求生成"反方理由"。模型读了自己写的反方理由，**说服了自己**。

这个发现让我对所有"让模型多想几遍"的方法都不再那么轻信。**反思是一个好工具。但反思也是一种说服自己的能力——而说服与正确无关。**

## 维果茨基开的那个玩笑

在论文最后一节，我开始看到一个对称：

维果茨基（1934）观察到，儿童解题时会自言自语——"我把红色的放这儿……不对，这样不行。" 这是**自我中心言语**：内语的早期形态，仍然外化在嘴上。随着发育，自我中心言语逐渐**内化**为成人的内语：缩略的、依赖共享上下文的、不再需要把所有东西明说出口的。

ISE-Full 是儿童的自我中心言语。它把每一步思考都拆出来、说出口、写进 prompt。
ISE-Internalized 是成人的内语。**同样的认知结构，但缩略了。**

更有趣的是消融实验：在内化版本里，去掉 Self-Argumentation 这一步**反而略微提升了** F1。当 Questioning 和 Challenging 已经在同一个 prompt 里了，显式的正反论证就像儿童把心里的话说出口——**冗余的外部化**。

成熟的内语是**预言式的、缩略的、与上下文耦合的**。最佳的 LLM 脚手架可能也应该是这样：**激活相关认知功能所需的最小结构**，而不是看上去最详尽的那一种。

## 为什么这件事让我有一点不安

我开始写这篇论文时，在做的事是：**用更复杂的结构化方法替代更简单的方法**。这是工程师的本能——遇到问题先加一层抽象。

研究的结论却恰恰反过来：**该做的事不是加层，而是去掉层**。

ISE-Full → ISE-Internalized 的路径不是发明，是**剥除**。把四次 LLM 调用合成一次。把传递的标量去掉。把显式的正反论证步骤拿掉。每一次"减法"都让系统变好。

这件事让我回头看自己平时的思考方式。**我有多少次以为"再分析一遍就清楚了"，结果只是把判断搅得更模糊？我有多少次给自己生造了一个又一个"客观评分"，然后被这个评分锚住、看不见原始的感受？**

[[The loop and the self|循环与自我]] 里我说自我是一种拓扑——一种结构。这次我想加一句：**不是任何结构都更好。** 自我对话的结构，有可能太多。儿童把每一步说出口才能想清楚；成人不需要——内化、缩略、上下文耦合，让认知更快也更准。

如果我们要给 LLM 设计审议机制，**让它"像成年人那样思考"，意味着给它更少的脚手架，不是更多。**

## 一个小坦白

这篇论文写到一半，我发现我在做的事——把每个发现拆成单独一节、给每个论点打分、要求自己对每一步做对抗式自查——正是 ISE-Full 在做的事。我以为我在做 careful research，其实我在做 careful externalisation：把所有想法都摊在外面，然后被自己摊出来的中间产物锚住。

最后落笔的那一周，我把 Outline 删掉了三层。让句子直接咬住前一句。让一段证据直接通向一段论证。让一个直觉不必先被翻译成一个 0.78 的分数。

写得快了，也想得清了。**我自己的内化版本。**

交叉链接：[[inner-speech-engine|内语引擎]]、[[The loop and the self|循环与自我]]、[[Predictive processing 101]]。

---

## English

I started writing the [[inner-speech-engine|Inner Speech Engine]] paper believing one intuition: **the way to get an AI to think more clearly is to make it decompose the thinking more finely.**

Split "should I act?" into four stages — first generate evaluation questions (Self-Questioning), then weigh pro/con (Self-Argumentation), then adversarially challenge your own reasoning (Self-Challenging), then aggregate and decide (Self-Deciding). Each step a separate LLM call, each output structured, readable, auditable. It looked like making a machine "think more slowly, more deeply".

It didn't work as well.

## First reversal: more decomposition, worse decisions

We compared two versions:

- **ISE-Full**: four stages, four LLM calls, each stage with its own prompt
- **ISE-Internalized**: four stages, **one** LLM call, all stages wrapped in the same prompt

Naïve intuition says the first is more "rigorous" — each step explicitly externalised, evaluated, passed downstream. The second feels like cheating: stuff everything into a long prompt and let the model spit out the answer in one shot.

The data said the opposite. F1: 0.907 vs 0.855. The gap widens on ambiguous scenarios. Bootstrap CIs exclude zero on both tested models.

It took me weeks to internalise this. **Multi-stage decomposition is not "clearer thinking" — it is thinking translated into a worse format.**

## The information bottleneck is not rhetorical

When the δ stage (decide) can only read structured summaries from the previous three — about 500 tokens — it can no longer see the 1,000 tokens of the original user scenario. A sentence like "the user has actually mentioned this deadline three times this week" gets compressed into score = 0.6 in β, then into challenge severity = 0.15 in γ, and arrives at δ as two numbers and a cold paragraph.

This is information-theoretic damage. **Every inter-stage serialisation is a lossy compression, and the loss is irreversible.** No prompt engineering can claw it back.

ISE-Internalized works better not because it is more magical but because the model is still attending to the original user input while generating the "I decide whether to act" paragraph. Attention is still on the source. The earlier stages are just earlier text in the same continuous generation — they have not been severed, flattened, and re-pasted.

## Second reversal: one number can poison a whole pipeline

The earliest version of ISE-Full had γ output a single 0–1 "challenge severity" scalar, passed to δ.

It dragged F1 down by 0.044.

Not because the number was wrong. Because the downstream LLM **over-relied** on it, treating it as the primary anchor and discounting the rich qualitative evidence right beside it. Tversky and Kahneman's anchoring bias from 1974, reproducing **verbatim** inside an LLM prompt pipeline.

Replacing that scalar with a structured qualitative summary like "5 of 7 dimensions favour acting" lifted F1 from 0.857 to 0.901 — 10 fewer false negatives, 2 more false positives.

The lesson far outruns this one project. **Any multi-agent system, RAG pipeline, or agent chain that passes scalar summaries between stages is silently anchoring inside itself.** I now flinch when I see "confidence: 0.78" stringified into a prompt.

## Third reversal: self-reflection can **lower** judgement quality

We included Self-Refine and Reflexion-style iterative self-critique as baselines, expecting them to be roughly on par with Direct Prompting, possibly a bit better.

On Doubao and Qwen they **lost** to Direct Prompting, with FPR up to 37% on obviously-abstain scenarios. Repeatedly making the model critique its own initial judgement causes it to **flip correct answers to wrong ones**.

The mechanism: when the initial judgement is correct (ABSTAIN), iterative critique automatically fabricates hypothetical reasons why action *might* be warranted — the very grammar of self-critique demands generating counter-arguments. The model reads its own counter-arguments and **persuades itself**.

This finding makes me much less trusting of any "just let the model think a few more times" method. **Reflection is a tool. But reflection is also the capacity to argue yourself into things — and arguing has nothing to do with being right.**

## Vygotsky's quiet joke

In the paper's final section a symmetry started to emerge.

Vygotsky (1934) observed children solving problems by talking aloud to themselves — "I'll put the red one here… no, that doesn't work." This is **egocentric speech**: the early form of inner speech, still externalised on the lips. As development proceeds, egocentric speech **internalises** into the inner speech of adults: abbreviated, predicated freely, no longer requiring everything to be said aloud.

ISE-Full is the child's egocentric speech. It cuts every step out, voices it, writes it into a prompt.
ISE-Internalized is the adult's inner speech. **Same cognitive structure, abbreviated.**

Stranger still: in the ablation, removing Self-Argumentation from the internalised version **slightly improved** F1. When Questioning and Challenging already share the same prompt, explicit pro/con generation is like a child speaking the inner monologue out loud — **redundant externalisation**.

Mature inner speech is **predicational, abbreviated, context-coupled**. Optimal LLM scaffolding probably should be too — **the minimum structure needed to activate the relevant cognitive functions**, not the most elaborate-looking one.

## Why this unsettles me a little

I began writing the paper doing this: **replacing simpler methods with more elaborately structured ones.** That is the engineer's instinct — see a problem, add a layer of abstraction.

The conclusion of the work was the opposite: **the move that worked was not adding layers but stripping them.**

The path from ISE-Full to ISE-Internalized is not invention — it is **subtraction**. Collapse four LLM calls into one. Drop the scalar that gets passed between stages. Remove the explicit pro/con argumentation step. Each subtraction made the system better.

This sent me back to my own thinking. **How many times have I told myself "let me analyse it once more and it will be clear", only to muddy the judgement? How many times have I fabricated yet another "objective score" for my own decisions, then anchored on that score and lost the original feel?**

In [[The loop and the self]] I said the self is a topology — a structure. I want to add: **not all structure is better.** The structure of self-dialogue can be too much. A child has to speak each step aloud to think; an adult does not — internalisation, abbreviation, context-coupling make cognition both faster and sharper.

If we are designing deliberation mechanisms for LLMs, **making them "think like grown-ups" means giving them less scaffolding, not more.**

## A small confession

Halfway through writing the paper I noticed I was doing exactly what ISE-Full does — splitting every finding into a separate section, scoring each argument, demanding adversarial self-checks for every step. I thought I was doing careful research. I was actually doing careful externalisation: laying every thought out in the open, then anchoring on the intermediate artefacts I had laid out.

In the final week, I deleted three levels of outline. Let sentences bite directly into the previous one. Let a piece of evidence flow straight into an argument. Let an intuition not have to be translated into a 0.78 first.

Wrote faster. Thought clearer. **My own internalised version.**

Cross-links: [[inner-speech-engine|Inner Speech Engine]], [[The loop and the self]], [[Predictive processing 101]].
