---
title: 注意力即全部所需
title_en: Attention is All You Need
authors: [Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin]
venue: NeurIPS 2017
link: arXiv:1706.03762
lang: zh
created: 2026-05-02
tags: [ai, transformers, attention, deep-learning]
---

Transformer 那篇。值得一读，不只是因为它对 NLP 做了什么，更是因
为它彻底重组了整个领域对"序列建模"这件事的直觉。

## 我反复回到的几点

- 在架构上有勇气**完全去掉**循环。2017 年 RNN 的霸权是完整的；
  转向纯自注意力不是渐进的，是绝对的。
- 归纳偏置弱得令人震惊——没有空间结构、没有时间核，只有学到的位
  置编码与两两交互。当时大部分先前工作都假设强序列先验是必要
  的；这篇论文表明那是拐杖。
- 算力故事至少和算法故事一样重要。自注意力沿序列轴可并行，
  RNN 不行。如果没有那个算力性质，Transformer 会留作奇观，而不
  是每一个前沿模型的底座。

## 要避开的误解

论文标题里的 "attention" 是指**对学到的表示做点积加权聚合**。在
机制上，它与认知神经科学或心理学意义上的"注意"几乎没有关系。把
两者当作同一个概念是类比，不是同一性。（参见
[[Attention as relation, not state]] 看为什么这一点要紧。）

## 它没说的

- 它没有确立"把 Transformer 扩展之后会得到通用智能"。那是后来
  在经验上发生的，作者并没有预测到。
- 它没有谈样本效率、对齐、可解释性，或后续八年里主导研究议题的
  那些问题。

但你不能因为一篇奠基性论文没有预见到它的后裔而苛责它。读它，是
为了那一招的干净。

交叉链接：[[The loop and the self]]，关于 attention-as-aggregation
是否可作为自我的候选底质。

---

## English

The Transformer paper. Notable not just for what it did to NLP, but
for how completely it reorganised the field's intuitions about what
"sequence modelling" means.

## What I keep returning to

- The architectural courage of *removing* recurrence entirely. RNN
  hegemony in 2017 was complete; the move to pure self-attention was
  not gradual, it was absolute.
- The inductive bias is shockingly weak — no spatial structure, no
  temporal kernel, just learned positional encodings and pairwise
  interaction. Most of the prior work assumed strong sequence priors
  were necessary; this paper showed they were a crutch.
- The compute story matters at least as much as the algorithmic story.
  Self-attention is parallelisable along the sequence axis in a way
  RNNs are not. Without that compute property, Transformers would
  remain a curiosity, not the substrate of every frontier model.

## Misunderstandings to avoid

The "attention" in the paper title is **dot-product weighted
aggregation over learned representations**. It has, mechanistically,
almost no relationship to attention as understood in cognitive
neuroscience or psychology. Treating the two as the same concept is
an analogy, not an identity. (See [[Attention as relation, not state]]
for why this matters.)

## What it doesn't say

- It doesn't establish that scaling Transformers gives you general
  intelligence. That came later, empirically, and the authors didn't
  predict it.
- It doesn't address sample efficiency, alignment, interpretability,
  or any of the things that ended up dominating the next eight years
  of follow-on work.

But you don't fault a foundational paper for not foreseeing its own
descendants. You read it for the cleanness of the move.

Cross-link: [[The loop and the self]], for the question of whether
attention-as-aggregation is a candidate substrate for selfhood.
